/* eslint-disable max-nested-callbacks */
import { init } from './withdraw-common'
import { DevProtocolInstance } from '../test-lib/instance'
import { PropertyInstance } from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import {
	toBigNumber,
	splitValue,
	forwardBlockTimestamp,
	getBlockTimestamp,
} from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import { SHARE_OF_TREASURY } from '../test-lib/const'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'
import {
	validateErrorMessage,
	validateAddressErrorMessage,
} from '../test-lib/utils/error'

contract('WithdrawTest', ([deployer, user1, , user3]) => {
	let dev: DevProtocolInstance
	let property: PropertyInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		;[dev, , property, ,] = await init(deployer, user3)
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})
	describe('Withdraw; withdraw', () => {
		it('should fail to call when passed address is not property contract', async () => {
			const res = await dev.withdraw
				.withdraw(deployer)
				.catch((err: Error) => err)
			validateAddressErrorMessage(res)
		})
		it(`should fail to call when hasn't withdrawable amount`, async () => {
			const res = await dev.withdraw
				.withdraw(property.address, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(res, 'withdraw value is 0')
		})
		describe('Withdraw; Withdraw is mint', () => {
			const alis = user1
			const bob = deployer
			it('Withdraw mints an ERC20 token specified in the Address Config Contract', async () => {
				await dev.dev.mint(alis, new BigNumber(1e18).times(10000000))
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: alis,
				})

				// @ts-expect-error overloading functions aren't working
				// pulled from https://github.com/trufflesuite/truffle/issues/3506
				await dev.lockup.methods['depositToProperty(address,uint256)'](
					property.address,
					'10000000000000000000000',
					{
						from: alis,
					}
				)

				await forwardBlockTimestamp(1)
				const prev = await dev.dev.totalSupply().then(toBigNumber)
				const balance = await dev.dev.balanceOf(deployer).then(toBigNumber)

				await dev.withdraw.withdraw(property.address, { from: bob })

				const next = await dev.dev.totalSupply().then(toBigNumber)
				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const gap = next.minus(prev)

				expect(prev.toString()).to.be.not.equal(next.toString())
				expect(balance.plus(gap).toString()).to.be.equal(
					afterBalance.toString()
				)
			})
		})
		describe('Withdraw; Withdrawable amount', () => {
			it('The withdrawable amount each holder is the number multiplied the balance of the price per Property Contract and the Property Contract of the sender', async () => {
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: user3,
				})

				// @ts-expect-error overloading functions aren't working
				// pulled from https://github.com/trufflesuite/truffle/issues/3506
				await dev.lockup.methods['depositToProperty(address,uint256)'](
					property.address,
					'10000000000000000000000',
					{
						from: user3,
					}
				)

				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const totalSupply = await property.totalSupply().then(toBigNumber)
				const oneBlockAmount = toBigNumber(9e19)
				const user1Share = 20
				await property.transfer(user1, totalSupply.div(100).times(user1Share), {
					from: deployer,
				})
				const t2 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const [deployerFirstShare] = splitValue(
					oneBlockAmount,
					SHARE_OF_TREASURY
				)
				const [deployerSecondShare] = splitValue(
					oneBlockAmount,
					SHARE_OF_TREASURY + user1Share
				)
				const t3 = await getBlockTimestamp()
				const amount1 = await dev.withdraw.calculateRewardAmount(
					property.address,
					deployer
				)
				const amount2 = await dev.withdraw.calculateRewardAmount(
					property.address,
					user1
				)
				expect(
					deployerFirstShare
						.times(t2 - t1)
						.plus(deployerSecondShare.times(t3 - t2))
						.integerValue(BigNumber.ROUND_DOWN)
						.toFixed()
				).to.be.equal(toBigNumber(amount1[0]).toFixed())
				expect(
					oneBlockAmount
						.div(100)
						.times(user1Share)
						.times(t3 - t2)
						.integerValue(BigNumber.ROUND_DOWN)
						.toFixed()
				).to.be.equal(toBigNumber(amount2[0]).toFixed())
			})
			it('The withdrawal amount is always the full amount of the withdrawable amount', async () => {
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: user3,
				})

				// @ts-expect-error overloading functions aren't working
				// pulled from https://github.com/trufflesuite/truffle/issues/3506
				await dev.lockup.methods['depositToProperty(address,uint256)'](
					property.address,
					'10000000000000000000000',
					{
						from: user3,
					}
				)

				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)

				const totalSupply = await property.totalSupply().then(toBigNumber)
				const prevBalance1 = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const prevBalance2 = await dev.dev.balanceOf(user1).then(toBigNumber)

				const rate = 0.2
				await property.transfer(user1, totalSupply.times(rate), {
					from: deployer,
				})
				const t2 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)

				const res1 = await dev.withdraw.withdraw(property.address, {
					from: deployer,
				})
				const t3 = await getBlockTimestamp(res1.receipt.blockNumber)
				await forwardBlockTimestamp(1)

				const res2 = await dev.withdraw.withdraw(property.address, {
					from: user1,
				})
				const t4 = await getBlockTimestamp(res2.receipt.blockNumber)
				const nextBalance1 = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const nextBalance2 = await dev.dev.balanceOf(user1).then(toBigNumber)
				expect(
					prevBalance1
						.plus(
							toBigNumber(9e19)
								.times(0.95)
								.times(t2 - t1)
								.plus(
									toBigNumber(9e19)
										.times(0.75)
										.times(t3 - t2)
								)
						)
						.toFixed()
				).to.be.equal(nextBalance1.toFixed())
				expect(
					prevBalance2
						.plus(
							toBigNumber(9e19)
								.times(0.2)
								.times(t4 - t2)
						)
						.toFixed()
				).to.be.equal(nextBalance2.toFixed())
			})
			it('should fail to withdraw when the withdrawable amount is 0', async () => {
				const prevBalance = await dev.dev.balanceOf(user1).then(toBigNumber)

				const amount = await dev.withdraw.calculateRewardAmount(
					property.address,
					user1
				)
				const res = await dev.withdraw
					.withdraw(property.address, { from: user1 })
					.catch((err: Error) => err)
				const afterBalance = await dev.dev.balanceOf(user1).then(toBigNumber)

				expect(toBigNumber(amount[0]).toFixed()).to.be.equal('0')
				expect(prevBalance.toFixed()).to.be.equal(afterBalance.toFixed())
				validateErrorMessage(res, 'withdraw value is 0')
			})
		})
	})
	describe('Withdraw; cap', () => {
		const propertyAuthor = deployer
		const alis = user1
		const prepare = async (): Promise<
			[
				DevProtocolInstance,
				[PropertyInstance, PropertyInstance, PropertyInstance]
			]
		> => {
			const [dev, , property, , market] = await init(deployer, user3)
			await dev.dev.mint(alis, new BigNumber(1e18).times(10000000))
			const propertyAddress2 = getPropertyAddress(
				await dev.propertyFactory.create('test2', 'TEST2', propertyAuthor)
			)
			const [property2] = await Promise.all([
				artifacts.require('Property').at(propertyAddress2),
			])
			const propertyAddress3 = getPropertyAddress(
				await dev.propertyFactory.create('test2', 'TEST2', propertyAuthor)
			)
			const [property3] = await Promise.all([
				artifacts.require('Property').at(propertyAddress3),
			])
			await market.authenticate(property2.address, ['id2'])
			await market.authenticate(property3.address, ['id3'])
			await dev.dev.approve(dev.lockup.address, 12000000000, {
				from: alis,
			})
			return [dev, [property, property2, property3]]
		}

		const calculateRewardAndCap = async (
			dev: DevProtocolInstance,
			property: PropertyInstance,
			user: string
		): Promise<[BigNumber, BigNumber]> => {
			const result = await dev.lockup.calculateRewardAmount(property.address)
			const reward = toBigNumber(result[0])
			const cap = toBigNumber(result[1])
			const lastReward = await dev.withdraw
				.lastWithdrawnRewardPrice(property.address, user)
				.then(toBigNumber)
			const lastRewardCap = await dev.withdraw
				.lastWithdrawnRewardCapPrice(property.address, user)
				.then(toBigNumber)
			const balance = await property.balanceOf(user).then(toBigNumber)
			const totalSupply = await property.totalSupply().then(toBigNumber)
			const unitPrice = reward
				.minus(lastReward)
				.times(toBigNumber(1e18))
				.idiv(totalSupply)
			const unitPriceCap = cap.minus(lastRewardCap).idiv(totalSupply)
			const allReward = unitPrice
				.times(balance)
				.idiv(toBigNumber(1e18))
				.idiv(toBigNumber(1e18))
			const capped = unitPriceCap.times(balance).idiv(toBigNumber(1e18))
			const value = capped.isZero()
				? allReward
				: allReward.isLessThanOrEqualTo(capped)
				? allReward
				: capped
			return [value, capped]
		}

		const checkAmount = async (
			dev: DevProtocolInstance,
			property: PropertyInstance,
			user: string
		): Promise<void> => {
			await forwardBlockTimestamp(1)
			const [value, capped] = await calculateRewardAndCap(dev, property, user)
			const amount = await dev.withdraw.calculateRewardAmount(
				property.address,
				user
			)
			const expected = value.isGreaterThan(capped) ? capped : value
			expect(toBigNumber(amount[0]).toFixed()).to.be.equal(expected.toFixed())
		}

		it(`cap`, async () => {
			const [dev, [property1, property2, property3]] = await prepare()

			// @ts-expect-error overloading functions aren't working
			// pulled from https://github.com/trufflesuite/truffle/issues/3506
			await dev.lockup.methods['depositToProperty(address,uint256)'](
				property1.address,
				toBigNumber(1000000000),
				{
					from: alis,
				}
			)

			// @ts-expect-error overloading functions aren't working
			// pulled from https://github.com/trufflesuite/truffle/issues/3506
			await dev.lockup.methods['depositToProperty(address,uint256)'](
				property2.address,
				toBigNumber(2000000000),
				{
					from: alis,
				}
			)

			// @ts-expect-error overloading functions aren't working
			// pulled from https://github.com/trufflesuite/truffle/issues/3506
			await dev.lockup.methods['depositToProperty(address,uint256)'](
				property3.address,
				toBigNumber(3000000000),
				{
					from: alis,
				}
			)

			const cap = toBigNumber(1817120592)
			await dev.updateCap(cap.toFixed())
			await checkAmount(dev, property1, propertyAuthor)
			await checkAmount(dev, property2, propertyAuthor)
			await checkAmount(dev, property3, propertyAuthor)
			await dev.lockup.depositToPosition(1, toBigNumber(1000000000), {
				from: alis,
			})
			await dev.lockup.depositToPosition(2, toBigNumber(2000000000), {
				from: alis,
			})
			await dev.lockup.depositToPosition(3, toBigNumber(3000000000), {
				from: alis,
			})

			const cap2 = toBigNumber(3634241185)
			await dev.updateCap(cap2.toFixed())
			await checkAmount(dev, property1, propertyAuthor)
			await checkAmount(dev, property2, propertyAuthor)
			await checkAmount(dev, property3, propertyAuthor)
		})
	})
})
