/* eslint-disable max-nested-callbacks */
import { init } from './withdraw-common'
import type { DevProtocolInstance } from '../test-lib/instance'
import type { PropertyInstance } from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import {
	toBigNumber,
	splitValue,
	getAmountFromPosition,
	forwardBlockTimestamp,
	getBlockTimestamp,
} from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import { SHARE_OF_TREASURY } from '../test-lib/const'
import { validateAddressErrorMessage } from '../test-lib/utils/error'

contract('WithdrawTest', ([deployer, user1, user2, user3, user4]) => {
	describe('Withdraw; withdraw', () => {
		describe('withdrawing interest amount', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance

			const alis = user1
			const bob = deployer

			before(async () => {
				;[dev, , property] = await init(deployer, user3)
				await dev.dev.mint(alis, new BigNumber(1e18).times(10000000))
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: alis,
				})
				await dev.lockup.depositToProperty(
					property.address,
					'10000000000000000000000',
					{
						from: alis,
					},
				)
			})

			it(`withdrawing sender's withdrawable interest full amount`, async () => {
				const t1 = await getBlockTimestamp()
				const beforeBalance = await dev.dev
					.balanceOf(deployer)
					.then(toBigNumber)
				const beforeTotalSupply = await dev.dev.totalSupply().then(toBigNumber)
				await forwardBlockTimestamp(10)
				const res = await dev.withdraw.withdraw(property.address, { from: bob })
				const t2 = await getBlockTimestamp(res.receipt.blockNumber)
				const reward = toBigNumber(9e19)
					.times(0.95)
					.times(t2 - t1)

				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const afterTotalSupply = await dev.dev.totalSupply().then(toBigNumber)
				expect(afterBalance.toFixed()).to.be.equal(
					beforeBalance.plus(reward).toFixed(),
				)
				expect(afterTotalSupply.toFixed()).to.be.equal(
					beforeTotalSupply.plus(reward).toFixed(),
				)
			})
			it('withdrawable interest amount becomes 0 when after withdrawing interest', async () => {
				const amount = await dev.withdraw.calculateRewardAmount(
					property.address,
					bob,
				)
				expect(toBigNumber(amount[0]).toFixed()).to.be.equal('0')
			})
		})
	})

	describe('Withdraw; beforeBalanceChange', () => {
		describe('Withdraw; Alice has sent 10% tokens to Bob after 20% tokens sent. Bob has increased from 10% tokens to 30% tokens.', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let timestamp: number
			const alice = deployer
			const bob = user1
			const FIRST_TRANSFER_PERCENTAGE = 20
			const SECOUND_TRANSFER_PERCENTAGE = 10

			before(async () => {
				;[dev, , property] = await init(deployer, user3)

				const totalSupply = await property.totalSupply().then(toBigNumber)
				await property.transfer(
					bob,
					totalSupply.div(100).times(FIRST_TRANSFER_PERCENTAGE),
					{
						from: alice,
					},
				)
				await property.transfer(
					bob,
					totalSupply.div(100).times(SECOUND_TRANSFER_PERCENTAGE),
					{
						from: alice,
					},
				)
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: user3,
				})
				await dev.lockup.depositToProperty(
					property.address,
					'10000000000000000000000',
					{
						from: user3,
					},
				)
				timestamp = await getBlockTimestamp()
			})

			describe('Withdraw; Before increment', () => {
				it(`Alice's withdrawable amount is 70% of reward`, async () => {
					await forwardBlockTimestamp(1)
					const currentTs = await getBlockTimestamp()
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const [totalAmount] = splitValue(
						toBigNumber(9e19).times(currentTs - timestamp),
						FIRST_TRANSFER_PERCENTAGE +
							SECOUND_TRANSFER_PERCENTAGE +
							SHARE_OF_TREASURY,
					)
					expect(toBigNumber(aliceAmount[0]).toNumber()).to.be.equal(
						totalAmount.toNumber(),
					)
				})

				it(`Bob's withdrawable amount is 30% of reward`, async () => {
					const currentTs = await getBlockTimestamp()
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)
					const totalAmount = toBigNumber(9e19).times(currentTs - timestamp)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						totalAmount.times(0.3).integerValue(BigNumber.ROUND_DOWN).toFixed(),
					)
				})
			})

			describe('Withdraw; After increment', () => {
				it(`Alice's withdrawable amount is 70% of rewardd`, async () => {
					await forwardBlockTimestamp(1)
					const currentTs = await getBlockTimestamp()
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const [totalAmount] = splitValue(
						toBigNumber(9e19).times(currentTs - timestamp),
						FIRST_TRANSFER_PERCENTAGE +
							SECOUND_TRANSFER_PERCENTAGE +
							SHARE_OF_TREASURY,
					)
					expect(toBigNumber(aliceAmount[0]).toNumber()).to.be.equal(
						totalAmount.toNumber(),
					)
				})

				it(`Bob's withdrawable amount is 30% of reward`, async () => {
					await forwardBlockTimestamp(1)
					const currentTs = await getBlockTimestamp()
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)
					const totalAmount = toBigNumber(9e19).times(currentTs - timestamp)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						totalAmount.times(0.3).integerValue(BigNumber.ROUND_DOWN).toFixed(),
					)
				})

				it('Become 0 withdrawable amount when after withdrawing', async () => {
					await dev.withdraw.withdraw(property.address, { from: alice })
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					await dev.withdraw.withdraw(property.address, { from: bob })
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)

					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal('0')
				})
			})

			it('Should fail to call `beforeBalanceChange` when sent from other than Property Contract address', async () => {
				const res = await dev.withdraw
					.beforeBalanceChange(deployer, user1, {
						from: deployer,
					})
					.catch((err: Error) => err)
				validateAddressErrorMessage(res)
			})
		})
		describe('Withdraw; Alice has sent 10% tokens to Bob after 20% tokens sent. Bob has increased from 20% tokens to 30% tokens.', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			const timestamps = new Map<string, number>()
			const alice = deployer
			const bob = user1
			const TRANSFERD_PROPERTY_TOKEN_PERCENT = 10

			before(async () => {
				;[dev, , property] = await init(deployer, user3)

				const totalSupply = await property.totalSupply().then(toBigNumber)
				await property.transfer(
					bob,
					totalSupply.div(100).times(TRANSFERD_PROPERTY_TOKEN_PERCENT),
					{
						from: alice,
					},
				)
				await property.transfer(
					bob,
					totalSupply.div(100).times(TRANSFERD_PROPERTY_TOKEN_PERCENT),
					{
						from: alice,
					},
				)
				await dev.dev.approve(dev.lockup.address, '10000000000000000000000', {
					from: user3,
				})
				await dev.lockup.depositToProperty(
					property.address,
					'10000000000000000000000',
					{
						from: user3,
					},
				)
				timestamps.set('a1', await getBlockTimestamp())
			})

			describe('calculateRewardAmount; Before sent 10% tokens', () => {
				it(`Alice's withdrawable amount is 80% of reward`, async () => {
					await forwardBlockTimestamp(1)
					const currentTs = await getBlockTimestamp()
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const totalAmount = toBigNumber(9e19).times(
						currentTs - timestamps.get('a1')!,
					)
					const rewordPercent =
						100 -
						TRANSFERD_PROPERTY_TOKEN_PERCENT -
						TRANSFERD_PROPERTY_TOKEN_PERCENT -
						SHARE_OF_TREASURY
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						totalAmount
							.div(100)
							.times(rewordPercent)
							.integerValue(BigNumber.ROUND_DOWN)
							.toFixed(),
					)
				})

				it(`Bob's withdrawable amount is 20% of reward`, async () => {
					const currentTs = await getBlockTimestamp()
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)
					const totalAmount = toBigNumber(9e19).times(
						currentTs - timestamps.get('a1')!,
					)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						totalAmount.times(0.2).integerValue(BigNumber.ROUND_DOWN).toFixed(),
					)
				})
			})

			describe('calculateRewardAmount; After sent 10% tokens', () => {
				before(async () => {
					const totalSupply = await property.totalSupply().then(toBigNumber)
					const res = await property.transfer(
						bob,
						totalSupply.div(100).times(TRANSFERD_PROPERTY_TOKEN_PERCENT),
						{
							from: alice,
						},
					)
					timestamps.set('b1', await getBlockTimestamp(res.receipt.blockNumber))
					timestamps.set('b2', await getBlockTimestamp())
					await forwardBlockTimestamp(1)
					timestamps.set('b3', await getBlockTimestamp())
				})
				it(`Alice's withdrawable amount is 70% of rewardd`, async () => {
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const amount1 = toBigNumber(9e19)
						.times(timestamps.get('b1')! - timestamps.get('a1')!)
						.times(0.75)
						.integerValue(BigNumber.ROUND_DOWN)
					const amount2 = toBigNumber(9e19)
						.times(timestamps.get('b3')! - timestamps.get('b1')!)
						.times(0.65)
						.integerValue(BigNumber.ROUND_DOWN)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						amount1.plus(amount2).toFixed(),
					)
				})

				it(`Bob's withdrawable amount is 30% of reward`, async () => {
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)
					const amount1 = toBigNumber(9e19)
						.times(timestamps.get('b2')! - timestamps.get('a1')!)
						.times(0.2)
						.integerValue(BigNumber.ROUND_DOWN)
					const amount2 = toBigNumber(9e19)
						.times(timestamps.get('b3')! - timestamps.get('b2')!)
						.times(0.3)
						.integerValue(BigNumber.ROUND_DOWN)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						amount1.plus(amount2).toFixed(),
					)
				})

				it('Become 0 withdrawable amount when after withdrawing', async () => {
					await dev.withdraw.withdraw(property.address, { from: alice })
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					await dev.withdraw.withdraw(property.address, { from: bob })
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						bob,
					)

					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal('0')
				})
			})
		})
	})

	describe('Withdraw; calculateRewardAmount', () => {
		type calcResult = {
			readonly value: BigNumber
			readonly reword: BigNumber
			readonly cap: BigNumber
			readonly allReward: BigNumber
		}
		type Calculator = (
			prop: PropertyInstance,
			account: string,
		) => Promise<calcResult>
		const createCalculator =
			(dev: DevProtocolInstance): Calculator =>
			async (prop: PropertyInstance, account: string): Promise<calcResult> => {
				const [reword, cap] = await dev.lockup
					.calculateRewardAmount(prop.address)
					.then(to2BigNumbers)
				const [lastReward, pending, lastRewardCap, totalSupply, balanceOfUser] =
					await Promise.all([
						dev.withdraw.lastWithdrawnRewardPrice(prop.address, account),
						dev.withdraw.pendingWithdrawal(prop.address, account),
						dev.withdraw.lastWithdrawnRewardCapPrice(prop.address, account),
						prop.totalSupply(),
						prop.balanceOf(account),
					])
				const unitPrice = reword
					.minus(lastReward)
					.times(1e18)
					.div(totalSupply)
					.integerValue(BigNumber.ROUND_DOWN)
				const allReward = unitPrice
					.times(balanceOfUser)
					.div(1e18)
					.div(1e18)
					.integerValue(BigNumber.ROUND_DOWN)
				const unitPriceCap = cap.isGreaterThanOrEqualTo(lastRewardCap)
					? cap
							.minus(lastRewardCap)
							.times(1e18)
							.div(totalSupply)
							.integerValue(BigNumber.ROUND_DOWN)
					: cap.times(1e18).div(totalSupply).integerValue(BigNumber.ROUND_DOWN)
				const capped = unitPriceCap
					.times(balanceOfUser)
					.div(1e18)
					.div(1e18)
					.integerValue(BigNumber.ROUND_DOWN)
				const _value = capped.isZero()
					? allReward
					: allReward.lte(capped)
						? allReward
						: capped
				const hasAssets = await dev.metricsFactory.hasAssets(prop.address)
				if (!hasAssets) {
					return {
						value: new BigNumber(0),
						reword,
						cap,
						allReward: new BigNumber(0),
					}
				}

				const value = _value.plus(pending)
				return {
					value,
					reword,
					cap,
					allReward,
				}
			}

		const to2BigNumbers = (v: any): [BigNumber, BigNumber] => [
			new BigNumber(v[0]),
			new BigNumber(v[1]),
		]

		const to4BigNumbers = (
			v: any,
		): [BigNumber, BigNumber, BigNumber, BigNumber] => [
			new BigNumber(v[0]),
			new BigNumber(v[1]),
			new BigNumber(v[2]),
			new BigNumber(v[3]),
		]

		const validateCalculateRewardAmountData = async (
			dev: DevProtocolInstance,
			prop: PropertyInstance,
			account: string,
			result: calcResult,
		): Promise<void> => {
			const instance = dev.withdraw
			const [value, price, cap, allReward] = await instance
				.calculateRewardAmount(prop.address, account)
				.then(to4BigNumbers)
			expect(result.value.eq(value)).to.be.equal(true)
			expect(result.reword.eq(price)).to.be.equal(true)
			expect(result.cap.eq(cap)).to.be.equal(true)
			expect(result.allReward.eq(allReward)).to.be.equal(true)
		}

		describe('scenario; zero lockup', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const bob = user1

			before(async () => {
				;[dev, , property] = await init(deployer, user3)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(
					dev.lockup.address,
					toBigNumber(10000).times(1e18),
					{ from: bob },
				)
			})

			describe('When totally is 0', () => {
				it(`Alice's withdrawable reward is 0`, async () => {
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					expect(total.toFixed()).to.be.equal('0')
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
					const result = await calc(property, alice)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
			describe('When Property1 is 0', () => {
				before(async () => {
					const [property2] = await Promise.all([
						artifacts
							.require('Property')
							.at(
								getPropertyAddress(
									await dev.propertyFactory.create('test2', 'TEST2', alice),
								),
							),
					])
					await dev.metricsFactory.__setMetricsCountPerProperty(
						property2.address,
						1,
					)
					await dev.lockup.depositToProperty(
						property2.address,
						toBigNumber(10000).times(1e18),
						{ from: bob },
					)
				})

				it(`Alice's withdrawable reward is 0`, async () => {
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					expect(total.toFixed()).to.be.equal(
						toBigNumber(10000).times(1e18).toFixed(),
					)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
					const result = await calc(property, alice)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
		})
		describe('scenario; unauthenticated', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const bob = user1

			before(async () => {
				;[dev, , property] = await init(deployer, user3)
				calc = createCalculator(dev)
				await dev.dev.approve(
					dev.lockup.address,
					toBigNumber(20000).times(1e18),
					{ from: bob },
				)
				await dev.dev.mint(bob, new BigNumber(1e18).times(10000000))
			})

			it(`Unauthenticated property has no reward`, async () => {
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property.address,
					0,
				)
				const aliceAmount = await dev.withdraw.calculateRewardAmount(
					property.address,
					alice,
				)
				expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
				const result = await calc(property, alice)
				await validateCalculateRewardAmountData(dev, property, alice, result)
			})

			it(`Property that unauthenticated but already staked before DIP9 has no reward`, async () => {
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property.address,
					1,
				)
				await dev.lockup.depositToProperty(
					property.address,
					toBigNumber(10000).times(1e18),
					{
						from: bob,
					},
				)
				await forwardBlockTimestamp(1)
				await dev.lockup.depositToProperty(
					property.address,
					toBigNumber(10000).times(1e18),
					{
						from: bob,
					},
				)
				await forwardBlockTimestamp(1)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property.address,
					0,
				)
				const aliceAmount = await dev.withdraw.calculateRewardAmount(
					property.address,
					alice,
				)
				expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
				const result = await calc(property, alice)
				await validateCalculateRewardAmountData(dev, property, alice, result)
			})
		})
		describe('scenario; single lockup', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const carol = user2

			before(async () => {
				;[dev, , property] = await init(deployer, user3)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.approve(
					dev.lockup.address,
					toBigNumber(20000).times(1e18),
					{ from: carol },
				)
				await dev.dev.mint(carol, aliceBalance)
				await dev.lockup.depositToProperty(
					property.address,
					toBigNumber(10000).times(1e18),
					{ from: carol },
				)
			})

			/*
			 * PolicyTestForAllocator returns 100 as rewards
			 * And holders share is 90%
			 */

			describe('before withdrawal', () => {
				it(`Property1 is locked-up 100% of all Property's locked-ups`, async () => {
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const property1 = await dev.lockup
						.totalLockedForProperty(property.address)
						.then(toBigNumber)
					expect(property1.toFixed()).to.be.equal(total.toFixed())
				})
				it(`Alice's withdrawable reward is 900% of Carol's withdrawable interest`, async () => {
					const t1 = await getBlockTimestamp()
					await forwardBlockTimestamp(9)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const t2 = await getBlockTimestamp()
					const expected = toBigNumber(9e19).times(t2 - t1)
					const [reword] = splitValue(expected)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						reword.toFixed(),
					)
					const result = await calc(property, alice)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					await dev.withdraw.withdraw(property.address, { from: alice })
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const result = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						result.value.toFixed(),
					)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
			describe('after additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(
						1,
						toBigNumber(10000).times(1e18),
						{ from: carol },
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const result = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						result.value.toFixed(),
					)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
			describe('after staking withdrawal', () => {
				before(async () => {
					await dev.sTokensManager.positions(1)
					await dev.lockup.withdrawByPosition(
						1,
						await getAmountFromPosition(dev, 1),
						{
							from: carol,
						},
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(6)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const result = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						result.value.toFixed(),
					)
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					await dev.withdraw.withdraw(property.address, { from: alice })
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const result = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(dev, property, alice, result)
				})
			})
		})

		describe('scenario: multiple lockup', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let timestamp: number
			let calc: Calculator

			const alice = deployer
			const bob = user1
			const carol = user2
			const bobFirstDepositTokrnid = 1
			const carolFirstDepositTokrnid = 2

			before(async () => {
				;[dev, , property] = await init(deployer, user3)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.mint(carol, aliceBalance)
				await dev.dev.approve(dev.lockup.address, '20000000000000000000000', {
					from: bob,
				})
				await dev.dev.approve(dev.lockup.address, '20000000000000000000000', {
					from: carol,
				})
				await dev.lockup.depositToProperty(
					property.address,
					'10000000000000000000000',
					{
						from: bob,
					},
				)
				timestamp = await getBlockTimestamp()
				await dev.lockup.depositToProperty(
					property.address,
					toBigNumber('10000000000000000000000').times('0.25'),
					{
						from: carol,
					},
				)
			})

			describe('before withdrawal', () => {
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					const currentTs = await getBlockTimestamp()
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const expected = toBigNumber(9e19).times(currentTs - timestamp)
					const calcResult = await calc(property, alice)
					const [tmp] = splitValue(expected)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						tmp.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property,
						alice,
						calcResult,
					)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					await dev.withdraw.withdraw(property.address, { from: alice })
				})

				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const calcResult = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property,
						alice,
						calcResult,
					)
				})
			})
			describe('additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(bobFirstDepositTokrnid, 10000, {
						from: bob,
					})
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const calcResult = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property,
						alice,
						calcResult,
					)
				})
			})
			describe('after staking withdrawal', () => {
				it(`Alice's withdrawable holders rewards is correct when also after withdrawal by Carol`, async () => {
					await dev.lockup.withdrawByPosition(
						carolFirstDepositTokrnid,
						await getAmountFromPosition(dev, carolFirstDepositTokrnid),
						{
							from: carol,
						},
					)

					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const calcResult = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property,
						alice,
						calcResult,
					)
				})
				it(`Alice's withdrawable holders rewards is correct when also after withdrawal by Bob`, async () => {
					await dev.lockup.withdrawByPosition(
						bobFirstDepositTokrnid,
						await getAmountFromPosition(dev, bobFirstDepositTokrnid),
						{
							from: bob,
						},
					)
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property.address,
						alice,
					)
					const calcResult = await calc(property, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property,
						alice,
						calcResult,
					)
				})
			})
		})

		describe('scenario: multiple properties', () => {
			let dev: DevProtocolInstance
			let property1: PropertyInstance
			let property2: PropertyInstance
			let property3: PropertyInstance
			let property4: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const bob = user1
			const carol = user2
			const dave = user4

			const daveFirstDepositTokenId = 1
			const daveSecondDepositTokenId = 2
			const daveThirdDepositTokenId = 3

			before(async () => {
				;[dev, , property1] = await init(deployer, user3)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.mint(carol, aliceBalance)
				await dev.dev.mint(dave, aliceBalance)
				;[property2, property3, property4] = await Promise.all([
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test2', 'TEST2', bob),
							),
						),
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test3', 'TEST3', carol),
							),
						),
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test4', 'TEST4', carol),
							),
						),
				])
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property2.address,
					1,
				)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property3.address,
					1,
				)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property4.address,
					1,
				)
				await dev.dev.approve(dev.lockup.address, '50000000000000000000000', {
					from: dave,
				})
				await dev.lockup.depositToProperty(
					property1.address,
					'10000000000000000000000',
					{
						from: dave,
					},
				)
				await forwardBlockTimestamp(3)
			})

			describe('before withdrawal', () => {
				it('No staked Property is 0 reward', async () => {
					const result = await dev.withdraw.calculateRewardAmount(
						property4.address,
						alice,
					)
					const calcResult = await calc(property4, alice)
					expect(toBigNumber(result[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(calcResult.value.toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(
						dev,
						property4,
						alice,
						calcResult,
					)
				})
				it(`Property1 is locked-up 100% of all Property's locked-ups`, async () => {
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const property1Balance = await dev.lockup
						.totalLockedForProperty(property1.address)
						.then(toBigNumber)
					expect(property1Balance.toFixed()).to.be.equal(total.toFixed())
				})
				it(`Alice's withdrawable holders reward is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					const calcResult = await calc(property1, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property1,
						alice,
						calcResult,
					)
				})
				it(`Alice does staking 2500 to Property2, Property2 is 20% of the total rewards`, async () => {
					await dev.lockup.depositToProperty(
						property2.address,
						'2500000000000000000000',
						{
							from: dave,
						},
					)
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const p1 = await dev.lockup
						.totalLockedForProperty(property1.address)
						.then(toBigNumber)
					const p2 = await dev.lockup
						.totalLockedForProperty(property2.address)
						.then(toBigNumber)
					expect(p1.div(total).toNumber()).to.be.equal(0.8)
					expect(p2.div(total).toNumber()).to.be.equal(0.2)
				})
				it(`Alice does staking 3750 to Property3, Property1 is ${
					1000000 / 16250
				}% of the total rewards, Property2 is ${
					250000 / 16250
				}% of the total rewards`, async () => {
					await dev.lockup.depositToProperty(
						property3.address,
						'3750000000000000000000',
						{
							from: dave,
						},
					)
					const total = await dev.lockup.totalLocked().then(toBigNumber)
					const p1 = await dev.lockup
						.totalLockedForProperty(property1.address)
						.then(toBigNumber)
					const p2 = await dev.lockup
						.totalLockedForProperty(property2.address)
						.then(toBigNumber)
					const p3 = await dev.lockup
						.totalLockedForProperty(property3.address)
						.then(toBigNumber)
					expect(p1.div(total).toNumber()).to.be.equal(10000 / 16250)
					expect(p2.div(total).toNumber()).to.be.equal(2500 / 16250)
					expect(p3.div(total).toNumber()).to.be.equal(3750 / 16250)
				})
				it(`Alice's withdrawable holders reward is correct`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					const calcResult = await calc(property1, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property1,
						alice,
						calcResult,
					)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					await dev.withdraw.withdraw(property1.address, { from: alice })
					await dev.withdraw.withdraw(property2.address, { from: bob })
					await dev.withdraw.withdraw(property3.address, { from: carol })
					await forwardBlockTimestamp(3)
				})
				it('No staked Property is 0 reward', async () => {
					const result = await dev.withdraw.calculateRewardAmount(
						property4.address,
						alice,
					)
					const calcResult = await calc(property4, alice)
					expect(toBigNumber(result[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(calcResult.value.toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(
						dev,
						property4,
						alice,
						calcResult,
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					const calcResult = await calc(property1, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property1,
						alice,
						calcResult,
					)
				})
				it(`Bob's withdrawable holders rewards is correct`, async () => {
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property2.address,
						bob,
					)
					const calcResult = await calc(property2, bob)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property2,
						bob,
						calcResult,
					)
				})
				it(`Carol's withdrawable holders rewards is correct`, async () => {
					const carolAmount = await dev.withdraw.calculateRewardAmount(
						property3.address,
						carol,
					)
					const calcResult = await calc(property3, carol)
					expect(toBigNumber(carolAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property3,
						carol,
						calcResult,
					)
				})
			})
			describe('after additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(
						daveFirstDepositTokenId,
						'10000000000000000000000',
						{
							from: dave,
						},
					)
					await dev.lockup.depositToPosition(
						daveSecondDepositTokenId,
						'10000000000000000000000',
						{
							from: dave,
						},
					)
					await dev.lockup.depositToPosition(
						daveThirdDepositTokenId,
						'10000000000000000000000',
						{
							from: dave,
						},
					)
					await forwardBlockTimestamp(3)
				})
				it('No staked Property is 0 reward', async () => {
					const result = await dev.withdraw.calculateRewardAmount(
						property4.address,
						alice,
					)
					const calcResult = await calc(property4, alice)
					expect(toBigNumber(result[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(calcResult.value.toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(
						dev,
						property4,
						alice,
						calcResult,
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					const calcResult = await calc(property1, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property1,
						alice,
						calcResult,
					)
				})
				it(`Bob's withdrawable holders rewards is correct`, async () => {
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property2.address,
						bob,
					)
					const calcResult = await calc(property2, bob)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property2,
						bob,
						calcResult,
					)
				})
				it(`Carol's withdrawable holders rewards is correct`, async () => {
					const calcResult = await calc(property3, carol)
					const carolAmount = await dev.withdraw.calculateRewardAmount(
						property3.address,
						carol,
					)
					expect(toBigNumber(carolAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property3,
						carol,
						calcResult,
					)
				})
			})
			describe('after staking withdrawal', () => {
				it('No staked Property is 0 reward', async () => {
					const result = await dev.withdraw.calculateRewardAmount(
						property4.address,
						alice,
					)
					const calcResult = await calc(property4, alice)
					expect(toBigNumber(result[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(calcResult.value.toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(
						dev,
						property4,
						alice,
						calcResult,
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await dev.lockup.withdrawByPosition(
						daveFirstDepositTokenId,
						await getAmountFromPosition(dev, daveFirstDepositTokenId),
						{ from: dave },
					)
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					const calcResult = await calc(property1, alice)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property1,
						alice,
						calcResult,
					)
				})
				it(`Bob's withdrawable holders rewards is correct`, async () => {
					await dev.lockup.withdrawByPosition(
						daveSecondDepositTokenId,
						await getAmountFromPosition(dev, daveSecondDepositTokenId),
						{ from: dave },
					)
					await forwardBlockTimestamp(3)
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property2.address,
						bob,
					)
					const calcResult = await calc(property2, bob)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property2,
						bob,
						calcResult,
					)
				})
				it(`Carol's withdrawable holders rewards is correct`, async () => {
					await dev.lockup.withdrawByPosition(
						daveThirdDepositTokenId,
						await getAmountFromPosition(dev, daveThirdDepositTokenId),
						{ from: dave },
					)
					await forwardBlockTimestamp(3)
					const carolAmount = await dev.withdraw.calculateRewardAmount(
						property3.address,
						carol,
					)
					const calcResult = await calc(property3, carol)
					expect(toBigNumber(carolAmount[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					await validateCalculateRewardAmountData(
						dev,
						property3,
						carol,
						calcResult,
					)
				})
			})
			describe('after withdrawal', () => {
				it('No staked Property is 0 reward', async () => {
					const result = await dev.withdraw.calculateRewardAmount(
						property4.address,
						alice,
					)
					const calcResult = await calc(property4, alice)
					expect(toBigNumber(result[0]).toFixed()).to.be.equal(
						calcResult.value.toFixed(),
					)
					expect(calcResult.value.toFixed()).to.be.equal('0')
					await validateCalculateRewardAmountData(
						dev,
						property4,
						alice,
						calcResult,
					)
				})
				it(`Alice's withdrawable holders rewards is correct`, async () => {
					await dev.withdraw.withdraw(property1.address, { from: alice })
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.withdraw.calculateRewardAmount(
						property1.address,
						alice,
					)
					expect(toBigNumber(aliceAmount[0]).toFixed()).to.be.equal('0')
				})
				it(`Bob's withdrawable holders rewards is correct`, async () => {
					await dev.withdraw.withdraw(property2.address, { from: bob })
					await forwardBlockTimestamp(3)
					const bobAmount = await dev.withdraw.calculateRewardAmount(
						property2.address,
						bob,
					)
					expect(toBigNumber(bobAmount[0]).toFixed()).to.be.equal('0')
				})
				it(`Carol's withdrawable holders rewards is correct`, async () => {
					await dev.withdraw.withdraw(property3.address, { from: carol })
					await forwardBlockTimestamp(3)
					const carolAmount = await dev.withdraw.calculateRewardAmount(
						property3.address,
						carol,
					)
					expect(toBigNumber(carolAmount[0]).toFixed()).to.be.equal('0')
				})
			})
		})

		describe('scenario: multiple properties: transfer tokens before got its first staking', () => {
			let dev: DevProtocolInstance
			let property1: PropertyInstance
			let property2: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const bob = user1
			const carol = user2
			const dave = user4

			before(async () => {
				;[dev, , property1] = await init(deployer, user3)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.mint(carol, aliceBalance)
				await dev.dev.mint(dave, aliceBalance)
				property2 = await artifacts
					.require('Property')
					.at(
						getPropertyAddress(
							await dev.propertyFactory.create('test2', 'TEST2', bob),
						),
					)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property2.address,
					1,
				)
				await dev.dev.approve(dev.lockup.address, '50000000000000000000000', {
					from: dave,
				})
				await dev.lockup.depositToProperty(
					property1.address,
					'10000000000000000000000',
					{
						from: dave,
					},
				)
				await forwardBlockTimestamp(3)
			})

			it('transfer tokens before got its first staking', async () => {
				await property2.transfer(alice, '3000000000000000000000000', {
					from: bob,
				})
				await dev.lockup.depositToProperty(
					property2.address,
					'10000000000000000000000',
					{
						from: dave,
					},
				)
				await forwardBlockTimestamp(3)
				const calcResult = await calc(property2, alice)
				await validateCalculateRewardAmountData(
					dev,
					property2,
					alice,
					calcResult,
				)
			})
		})
	})
})
