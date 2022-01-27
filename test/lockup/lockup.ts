import { DevProtocolInstance } from '../test-lib/instance'
import {
	PropertyInstance,
	PolicyTestBaseInstance,
} from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import { toBigNumber } from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('LockupTest', ([deployer, user1, user2]) => {
	const init = async (
		initialUpdate = true
	): Promise<
		[DevProtocolInstance, PropertyInstance, PolicyTestBaseInstance]
	> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevBridge()
		await dev.generateSTokensManager()

		await dev.generateMarketFactory()
		await dev.generateMetricsFactory()
		await dev.generateLockup()
		await dev.generateWithdraw()
		await dev.generatePropertyFactory()
		await dev.generatePolicyFactory()

		await dev.dev.mint(deployer, new BigNumber(1e18).times(10000000))
		const policyAddress = await dev.generatePolicy('PolicyTestBase')
		await dev.generateTreasury()
		await dev.setCapSetter()
		await dev.updateCap()

		const policy = await artifacts.require('PolicyTestBase').at(policyAddress)
		const propertyAddress = getPropertyAddress(
			await dev.propertyFactory.create('test', 'TEST', user2, {
				from: user2,
			})
		)
		const property = artifacts.require('Property').at(propertyAddress)

		await dev.metricsFactory.__addMetrics(
			(
				await dev.createMetrics(deployer, property.address)
			).address
		)

		if (initialUpdate) {
			await dev.lockup.update()
		}

		return [dev, property, policy]
	}

	let dev: DevProtocolInstance
	let property: PropertyInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		;[dev, property] = await init()
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

	const err = (error: Error): Error => error

	describe('Lockup; calculateRewardAmount', () => {
		const calculateCap = async (
			dev: DevProtocolInstance,
			property: PropertyInstance,
			holderCap: BigNumber
		): Promise<BigNumber> => {
			const initialCap = await dev.lockup
				.initialCumulativeHoldersRewardCap(property.address)
				.then(toBigNumber)
			return holderCap.minus(initialCap)
		}

		const calculateReword = async (
			dev: DevProtocolInstance,
			property: PropertyInstance,
			holders: BigNumber
		): Promise<BigNumber> => {
			const cHoldersReward = await dev.lockup
				.lastCumulativeHoldersRewardAmountPerProperty(property.address)
				.then(toBigNumber)
			const lastReward = await dev.lockup
				.lastCumulativeHoldersRewardPricePerProperty(property.address)
				.then(toBigNumber)
			const enabledStakingValue = await dev.lockup
				.totalLockedForProperty(property.address)
				.then(toBigNumber)
			const additionalHoldersReward = holders
				.minus(lastReward)
				.times(enabledStakingValue)
			return cHoldersReward.plus(additionalHoldersReward)
		}

		const calculate = async (
			dev: DevProtocolInstance,
			property: PropertyInstance
		): Promise<[BigNumber, BigNumber]> => {
			const tmp = await dev.lockup.calculateCumulativeRewardPrices()
			const reward = await calculateReword(dev, property, toBigNumber(tmp[1]))
			const cap = await calculateCap(dev, property, toBigNumber(tmp[3]))
			return [reward, cap]
		}

		it('The reward is calculated and comes back to you.', async () => {
			await dev.dev.approve(dev.lockup.address, '10000000000000000000000')
			await dev.lockup.depositToProperty(
				property.address,
				'10000000000000000000000'
			)
			await dev.updateCap()
			const [reword, cap] = await calculate(dev, property)
			const result = await dev.lockup.calculateRewardAmount(property.address)
			expect(toBigNumber(result[0]).toFixed()).to.be.equal(reword.toFixed())
			expect(toBigNumber(result[1]).toFixed()).to.be.equal(cap.toFixed())
		})
	})
	describe('Lockup; cap, updateCap', () => {
		const calculateCap = async (
			dev: DevProtocolInstance,
			cap: BigNumber
		): Promise<[BigNumber, BigNumber]> => {
			const tmp = await dev.lockup.calculateCumulativeRewardPrices()
			const holderPrice = toBigNumber(tmp[1])
			const cCap = toBigNumber(tmp[3])
			const lastHoldersPrice = await dev.lockup
				.lastCumulativeHoldersPriceCap()
				.then(toBigNumber)
			const additionalCap = holderPrice.minus(lastHoldersPrice).times(cap)
			const capValue = cCap.plus(additionalCap)
			return [capValue, holderPrice]
		}

		describe('success', () => {
			it('Can set cap.', async () => {
				const tx = await dev.lockup.updateCap(100)
				const eventLogs = tx.logs.filter(
					(log: { event: string }) => log.event === 'UpdateCap'
				)
				expect(eventLogs[0].args._cap.toNumber()).to.be.equal(100)
				const cap = await dev.lockup.cap()
				expect(cap.toNumber()).to.be.equal(100)
				const [capValue, holdersPrice] = await calculateCap(
					dev,

					toBigNumber(100)
				)
				const holderRewardCap = await dev.lockup
					.cumulativeHoldersRewardCap()
					.then(toBigNumber)
				expect(holderRewardCap.toString()).to.be.equal(capValue.toString())
				const holdersPriceCap = await dev.lockup
					.lastCumulativeHoldersPriceCap()
					.then(toBigNumber)
				expect(holdersPriceCap.toString()).to.be.equal(holdersPrice.toString())
			})
		})
		describe('fail', () => {
			it('Do not accept access from addresses other than the specified one.', async () => {
				const res = await dev.lockup.updateCap(100, { from: user1 }).catch(err)
				validateErrorMessage(res, 'illegal access')
			})
		})
	})
})
