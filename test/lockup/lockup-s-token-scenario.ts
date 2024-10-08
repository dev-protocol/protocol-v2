import { err, init } from './lockup-s-token-common'
import type { DevProtocolInstance } from '../test-lib/instance'
import type { PropertyInstance } from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import {
	toBigNumber,
	forwardBlockTimestamp,
	getBlockTimestamp,
} from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('LockupTest', ([deployer, user1, user2, user3]) => {
	describe('Lockup; calculateWithdrawableInterestAmountByPosition', () => {
		type Calculator = (tokenId: number) => Promise<string>
		const createCalculator =
			(dev: DevProtocolInstance): Calculator =>
			async (tokenId: number): Promise<string> => {
				const position = await dev.sTokensManager.positions(tokenId)
				const amount = toBigNumber(position.amount)
				const price = toBigNumber(position.price)
				const pendingReward = toBigNumber(position.pendingReward)
				const prices = await dev.lockup.calculateCumulativeRewardPrices()
				const interest = toBigNumber(prices[2])
				const interestAmount = interest.gte(price)
					? interest.minus(price).times(amount).div(1e18)
					: 0

				return pendingReward
					.plus(interestAmount)
					.toFixed(0, BigNumber.ROUND_DOWN)
			}

		describe('returns correct amount', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let calc: Calculator
			const timestamps = new Map<string, number>()

			const alice = deployer
			const bob = user1
			const aliceFirstTokenId = 1
			const bobFirstTokenId = 2
			const aliceSecoundTokenId = 3
			const bobSecoundTokenId = 4
			const aliceThirdTokenId = 6
			const aliceFourthTokenId = 7

			before(async () => {
				;[dev, property] = await init(deployer, user2)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(dev.lockup.address, aliceBalance.times(2), {
					from: alice,
				})
				await dev.dev.approve(dev.lockup.address, aliceBalance.times(2), {
					from: bob,
				})
			})

			/*
			 * PolicyTestBase returns 100 as rewards
			 * And stakers share is 10%
			 */
			it('Alice has a 100% of interests', async () => {
				await dev.lockup.depositToProperty(property.address, 1000000000000, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)

				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(t2 - t1)
				const calculated = await calc(aliceFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Alice has a 100% of interests after withdrawal', async () => {
				await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(t2 - t1)
				const calculated = await calc(aliceFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Alice has a 50% of interests', async () => {
				await dev.lockup.depositToProperty(property.address, 1000000000000, {
					from: bob,
				})
				timestamps.set('a1', await getBlockTimestamp())
				await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(1000000000000 / (1000000000000 * 2))
					.times(t2 - t1)
				const calculated = await calc(aliceFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Alice has a 75% of interests', async () => {
				await dev.lockup.depositToPosition(aliceFirstTokenId, 1000000000000, {
					from: alice,
				})
				timestamps.set('a2', await getBlockTimestamp())
				await dev.lockup.depositToPosition(aliceFirstTokenId, 1000000000000, {
					from: alice,
				})
				timestamps.set('b1', await getBlockTimestamp())
				await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(3000000000000 / (1000000000000 * 4))
					.times(t2 - t1)
				const calculated = await calc(aliceFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Bob has a 30% of interests before withdrawal', async () => {
				timestamps.set('b2', await getBlockTimestamp())
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
					.then(toBigNumber)
				const expected = toBigNumber(10)
					.times(1e18)
					.times(
						toBigNumber(1000000000000).div(toBigNumber(1000000000000).times(2)),
					)
					.times(timestamps.get('a2')! - timestamps.get('a1')!)
					.plus(
						toBigNumber(10)
							.times(1e18)
							.times(
								toBigNumber(1000000000000).div(
									toBigNumber(1000000000000).times(3),
								),
							)
							.times(timestamps.get('b1')! - timestamps.get('a2')!),
					)
					.plus(
						toBigNumber(10)
							.times(1e18)
							.times(
								toBigNumber(1000000000000).div(
									toBigNumber(1000000000000).times(4),
								),
							)
							.times(timestamps.get('b2')! - timestamps.get('b1')!),
					)
					.integerValue()
				const calculated = await calc(bobFirstTokenId)
				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Bob has a 25% of interests', async () => {
				await dev.lockup.withdrawByPosition(bobFirstTokenId, 0, { from: bob })
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(1000000000000 / (1000000000000 * 4))
					.times(t2 - t1)
				const calculated = await calc(bobFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Alice can withdraw 5 blocks', async () => {
				await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(5)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(3000000000000 / (1000000000000 * 4))
					.times(t2 - t1)
				const calculated = await calc(aliceFirstTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Alice has a 100% of interests', async () => {
				const alicePosition =
					await dev.sTokensManager.positions(aliceFirstTokenId)
				await dev.lockup.withdrawByPosition(
					aliceFirstTokenId,
					alicePosition.amount.toString(),
					{ from: alice },
				)
				const bobPosition = await dev.sTokensManager.positions(bobFirstTokenId)
				await dev.lockup.withdrawByPosition(
					bobFirstTokenId,
					bobPosition.amount.toString(),
					{ from: bob },
				)
				await dev.lockup.depositToProperty(property.address, 1000000000000, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceSecoundTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(t2 - t1)
				const calculated = await calc(aliceSecoundTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('After withdrawn, Alice and Bob has a 0% of interests', async () => {
				await dev.lockup.depositToPosition(aliceSecoundTokenId, 1000000000000, {
					from: alice,
				})
				await dev.lockup.depositToProperty(property.address, 1000000000000, {
					from: bob,
				})
				await forwardBlockTimestamp(2)
				const alicePosition =
					await dev.sTokensManager.positions(aliceSecoundTokenId)
				await dev.lockup.withdrawByPosition(
					aliceSecoundTokenId,
					alicePosition.amount.toString(),
					{ from: alice },
				)
				const bobPosition =
					await dev.sTokensManager.positions(bobSecoundTokenId)
				await dev.lockup.withdrawByPosition(
					bobSecoundTokenId,
					bobPosition.amount.toString(),
					{ from: bob },
				)
				await forwardBlockTimestamp(1)
				const aliceAmount =
					await dev.lockup.calculateWithdrawableInterestAmountByPosition(
						aliceSecoundTokenId,
					)
				const bobAmount =
					await dev.lockup.calculateWithdrawableInterestAmountByPosition(
						bobSecoundTokenId,
					)
				const aliceCalculated = await calc(aliceSecoundTokenId)
				const bobCalculated = await calc(bobSecoundTokenId)
				expect(aliceAmount.toString()).to.be.equal('0')
				expect(bobAmount.toString()).to.be.equal('0')
				expect(aliceCalculated.toString()).to.be.equal('0')
				expect(bobCalculated.toString()).to.be.equal('0')
			})
			it('Bob has huge staked, Alice has small amount of reward', async () => {
				const [property2] = await Promise.all([
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test', 'TEST', deployer),
							),
						),
				])
				await dev.metricsFactory.__setMetricsCountPerProperty(
					property2.address,
					1,
				)

				const bobBalance = toBigNumber(10000000).times(1e18)
				await dev.dev.mint(bob, bobBalance)
				await dev.lockup.depositToProperty(property.address, bobBalance, {
					from: bob,
				})
				await forwardBlockTimestamp(10)

				await dev.lockup.depositToProperty(property2.address, 10000000, {
					from: alice,
				})
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceThirdTokenId)
					.then(toBigNumber)
				const t2 = await getBlockTimestamp()
				const expected = toBigNumber(10)
					.times(1e18)
					.times(
						toBigNumber(10000000).div(toBigNumber(10000000).plus(bobBalance)),
					)
					.times(t2 - t1)
				const calculated = await calc(aliceThirdTokenId)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
				expect(result.toFixed()).to.be.equal(calculated)
			})
			it('Property that unauthenticated but already staked before DIP9 has no reward', async () => {
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test', 'TEST', deployer),
				)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					propertyAddress,
					1,
				)
				await dev.lockup.depositToProperty(propertyAddress, 1000000000000, {
					from: alice,
				})
				await forwardBlockTimestamp(1)
				await dev.lockup.depositToPosition(aliceFourthTokenId, 1000000000000, {
					from: alice,
				})
				await forwardBlockTimestamp(1)
				await dev.metricsFactory.__setMetricsCountPerProperty(
					propertyAddress,
					0,
				)
				const result = await dev.lockup
					.calculateWithdrawableInterestAmountByPosition(aliceFourthTokenId)
					.then(toBigNumber)
				const expected = toBigNumber(0)

				expect(result.toFixed()).to.be.equal(expected.toFixed())
			})
		})

		describe('scenario; token transfer', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let lastTimestamp: number

			const alice = deployer
			const bob = user1

			const aliceFirstTokenId = 1

			before(async () => {
				;[dev, property] = await init(deployer, user2)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: alice })
				await dev.lockup.depositToProperty(property.address, 10000, {
					from: alice,
				})

				lastTimestamp = await getBlockTimestamp()
			})

			/*
			 * PolicyTestBase returns 100 as rewards
			 * And stakers share is 10%
			 */

			describe('before run', () => {
				it(`Alice does staking 100% of the Property's total lockups`, async () => {
					const total = await dev.lockup
						.totalLockedForProperty(property.address)
						.then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					expect(toBigNumber(position.amount).toFixed()).to.be.equal(
						total.toFixed(),
					)
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					await forwardBlockTimestamp(9)
					const t1 = await getBlockTimestamp()
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(aliceAmount.toFixed()).to.be.equal(expected.toFixed())
				})
			})
			describe('token transfer', () => {
				before(async () => {
					await dev.sTokensManager.safeTransferFrom(
						alice,
						bob,
						aliceFirstTokenId,
					)
				})
				it(`withdrawable interest is 100% of the Property's interest`, async () => {
					await forwardBlockTimestamp(3)
					const calculateAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const t1 = await getBlockTimestamp()
					const expected = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(calculateAmount.toFixed()).to.be.equal(expected.toFixed())
					const ownerAddress =
						await dev.sTokensManager.ownerOf(aliceFirstTokenId)
					expect(ownerAddress).to.be.equal(bob)
				})
			})
			describe('Alice can not withdraw reward', () => {
				it(`if Alice execute withdraw function, error is occur`, async () => {
					const res = await dev.lockup
						.withdrawByPosition(aliceFirstTokenId, 0, {
							from: alice,
						})
						.catch(err)
					validateErrorMessage(res, 'illegal sender')
				})
			})

			describe('after withdrawal', () => {
				let bobBalance: BigNumber
				let bobLocked: BigNumber
				before(async () => {
					bobBalance = await dev.dev.balanceOf(bob).then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					bobLocked = toBigNumber(position.amount)
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, bobLocked, {
						from: bob,
					})
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					const t1 = await getBlockTimestamp()
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					const bobLockup = toBigNumber(position.amount)
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const afterBobBalance = await dev.dev.balanceOf(bob).then(toBigNumber)
					const reward = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(bobAmount.toFixed()).to.be.equal('0')
					expect(bobLockup.toFixed()).to.be.equal('0')
					expect(afterBobBalance.toFixed()).to.be.equal(
						bobBalance.plus(bobLocked).plus(reward).toFixed(),
					)
				})
			})
		})

		describe('scenario; single lockup', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let lastTimestamp: number

			const alice = deployer
			const bob = user1

			const aliceFirstTokenId = 1

			before(async () => {
				;[dev, property] = await init(deployer, user2)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: alice })
				await dev.lockup.depositToProperty(property.address, 10000, {
					from: alice,
				})

				lastTimestamp = await getBlockTimestamp()
			})

			/*
			 * PolicyTestBase returns 100 as rewards
			 * And stakers share is 10%
			 */

			describe('before second run', () => {
				it(`Alice does staking 100% of the Property's total lockups`, async () => {
					const total = await dev.lockup
						.totalLockedForProperty(property.address)
						.then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					expect(toBigNumber(position.amount).toFixed()).to.be.equal(
						total.toFixed(),
					)
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					await forwardBlockTimestamp(9)
					const t1 = await getBlockTimestamp()
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(aliceAmount.toFixed()).to.be.equal(expected.toFixed())
				})
			})
			describe('after second run', () => {
				before(async () => {
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
						from: alice,
					})
					lastTimestamp = await getBlockTimestamp()
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const t1 = await getBlockTimestamp()
					const expected = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(aliceAmount.toFixed()).to.be.equal(expected.toFixed())
				})
			})
			describe('after additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(aliceFirstTokenId, 10000, {
						from: alice,
					})
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					const t1 = await getBlockTimestamp()
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)

					expect(aliceAmount.toFixed()).to.be.equal(expected.toFixed())
				})
			})
			describe('after withdrawal', () => {
				let aliceBalance: BigNumber
				let aliceLocked: BigNumber
				before(async () => {
					aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					aliceLocked = toBigNumber(position.amount)
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, aliceLocked, {
						from: alice,
					})
				})
				it(`Alice's withdrawable interest is 100% of the Property's interest`, async () => {
					const t1 = await getBlockTimestamp()
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceLockup = toBigNumber(position.amount)
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const afterAliceBalance = await dev.dev
						.balanceOf(alice)
						.then(toBigNumber)
					const reward = toBigNumber(10) // In PolicyTestBase, the max staker reward per block is 10.
						.times(1e18)
						.times(t1 - lastTimestamp)
					expect(aliceAmount.toFixed()).to.be.equal('0')
					expect(aliceLockup.toFixed()).to.be.equal('0')
					expect(afterAliceBalance.toFixed()).to.be.equal(
						aliceBalance.plus(aliceLocked).plus(reward).toFixed(),
					)
				})
			})
		})
		describe('scenario: multiple lockup', () => {
			let dev: DevProtocolInstance
			let property: PropertyInstance
			let calc: Calculator

			const alice = deployer
			const bob = user1

			const aliceFirstTokenId = 1
			const bobFirstTokenId = 2

			before(async () => {
				;[dev, property] = await init(deployer, user2)
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: alice })
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: bob })
				await dev.lockup.depositToProperty(property.address, 10000, {
					from: alice,
				})
			})

			describe('before second run', () => {
				it(`Alice does staking 100% of the Property's total lockups`, async () => {
					const total = await dev.lockup
						.totalLockedForProperty(property.address)
						.then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(position.amount)
					expect(aliceBalance.toFixed()).to.be.equal(total.toFixed())
				})
				it(`Bob does staking 25% of the Property's total lockups, Alice's share become 80%`, async () => {
					await dev.lockup.depositToProperty(property.address, 10000 * 0.25, {
						from: bob,
					})
					const total = await dev.lockup
						.totalLockedForProperty(property.address)
						.then(toBigNumber)
					const alicePosition =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(alicePosition.amount)
					const bobPosition =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobBalance = toBigNumber(bobPosition.amount)

					expect(aliceBalance.toFixed()).to.be.equal(
						total.times(0.8).integerValue(BigNumber.ROUND_DOWN).toFixed(),
					)
					expect(bobBalance.toFixed()).to.be.equal(
						total.times(0.2).integerValue(BigNumber.ROUND_DOWN).toFixed(),
					)
				})
				it(`Alice's withdrawable interest is 100% of between lastBlockNumber and Bob's first deposit block interest and 80% of current interest`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)
					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of interest since the first deposit`, async () => {
					await forwardBlockTimestamp(3)
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)
					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('after second withdrawal', () => {
				before(async () => {
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
						from: alice,
					})
					await dev.lockup.withdrawByPosition(bobFirstTokenId, 0, { from: bob })
					await forwardBlockTimestamp(3)
				})
				it(`Alice's withdrawable interest is 80% of current interest`, async () => {
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)

					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of current interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(bobFirstTokenId, 12500 * 0.3, {
						from: bob,
					})
					await forwardBlockTimestamp(3)
				})
				it(`Bob does staking 30% of the Property's total lockups, Bob's share become ${
					625000 / 16250
				}%, Alice's share become ${1000000 / 16250}%`, async () => {
					const alicePosition =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(alicePosition.amount)
					const bobPosition =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobBalance = toBigNumber(bobPosition.amount)

					expect(10000).to.be.equal(
						new BigNumber(16250)
							.times(new BigNumber(10000).div(16250))
							.toNumber(),
					)
					expect(aliceBalance.toFixed()).to.be.equal('10000')
					expect(6250).to.be.equal(
						new BigNumber(16250)
							.times(new BigNumber(6250).div(16250))
							.toNumber(),
					)
					expect(bobBalance.toFixed()).to.be.equal('6250')
				})
			})
			describe('after additional staking', () => {
				it(`Alice's withdrawable interest is 80% of prev interest and ${
					1000000 / 16250
				}% of current interest`, async () => {
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)

					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of prev interest and ${
					625000 / 16250
				}% of current interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					const alicePosition =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(alicePosition.amount)
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, aliceBalance, {
						from: alice,
					})
					await forwardBlockTimestamp(3)
					const bobPosition =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobBalance = toBigNumber(bobPosition.amount)
					await dev.lockup.withdrawByPosition(bobFirstTokenId, bobBalance, {
						from: bob,
					})
					await forwardBlockTimestamp(3)
				})
				it(`Alice's withdrawable interest is 0`, async () => {
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)

					expect(aliceAmount.toFixed()).to.be.equal('0')
				})
				it(`Bob's withdrawable interest is 0`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)

					expect(bobAmount.toFixed()).to.be.equal('0')
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

			const alice = user2
			const bob = user1

			const aliceFirstTokenId = 1
			const bobFirstTokenId = 2
			const aliceSecoundTokenId = 3

			before(async () => {
				;[dev, property1] = await init(deployer, user2)
				await dev.dev.mint(alice, new BigNumber(1e18).times(10000000))
				calc = createCalculator(dev)
				const aliceBalance = await dev.dev.balanceOf(alice).then(toBigNumber)
				await dev.dev.mint(bob, aliceBalance)
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: alice })
				await dev.dev.approve(dev.lockup.address, aliceBalance, { from: bob })
				;[property2, property3, property4] = await Promise.all([
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test2', 'TEST2', user3),
							),
						),
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test3', 'TEST3', user3),
							),
						),
					artifacts
						.require('Property')
						.at(
							getPropertyAddress(
								await dev.propertyFactory.create('test4', 'TEST4', user3),
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

				await dev.lockup.depositToProperty(property1.address, 10000, {
					from: alice,
				})
				await forwardBlockTimestamp(3)
			})

			describe('before withdrawal', () => {
				it(`Alice does staking 100% of the Property1 total lockups, Property1 is 100% of the total rewards`, async () => {
					const total = await dev.lockup
						.totalLockedForProperty(property1.address)
						.then(toBigNumber)
					const position = await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(position.amount)
					expect(aliceBalance.toFixed()).to.be.equal(total.toFixed())
				})
				it(`Bob does staking 100% of the Property2 total lockups, Property2 is 20% of the total rewards`, async () => {
					await dev.lockup.depositToProperty(property2.address, 2500, {
						from: bob,
					})
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
				it(`Alice's withdrawable interest is 100% of between lastBlockNumber and Bob's first deposit block interest and 80% of current interest`, async () => {
					await forwardBlockTimestamp(3)
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)
					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of interest since the first deposit`, async () => {
					await forwardBlockTimestamp(3)
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)
					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('after withdrawal', () => {
				before(async () => {
					await dev.lockup.withdrawByPosition(aliceFirstTokenId, 0, {
						from: alice,
					})
					await dev.lockup.withdrawByPosition(bobFirstTokenId, 0, { from: bob })
					await forwardBlockTimestamp(3)
				})
				it(`Alice's withdrawable interest is 80% of current interest`, async () => {
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)

					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of current interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('additional staking', () => {
				before(async () => {
					await dev.lockup.depositToPosition(bobFirstTokenId, 12500 * 0.3, {
						from: bob,
					})
					await forwardBlockTimestamp(3)
				})
				it(`Bob does staking 30% of the all Property's total lockups, Bob's share become ${
					625000 / 16250
				}%, Alice's share become ${1000000 / 16250}%`, async () => {
					const alicePosition =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceBalance = toBigNumber(alicePosition.amount)
					const bobPosition =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobBalance = toBigNumber(bobPosition.amount)

					expect(10000).to.be.equal(
						new BigNumber(16250)
							.times(new BigNumber(10000).div(16250))
							.toNumber(),
					)
					expect(aliceBalance.toFixed()).to.be.equal('10000')
					expect(6250).to.be.equal(
						new BigNumber(16250)
							.times(new BigNumber(6250).div(16250))
							.toNumber(),
					)
					expect(bobBalance.toFixed()).to.be.equal('6250')
				})
			})
			describe('after additional staking', () => {
				it(`Alice's withdrawable interest is 80% of prev interest and ${
					1000000 / 16250
				}% of current interest`, async () => {
					const aliceAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(aliceFirstTokenId)

					expect(aliceAmount.toFixed()).to.be.equal(expected)
				})
				it(`Bob's withdrawable interest is 20% of prev interest and ${
					625000 / 16250
				}% of current interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('additional staking', () => {
				before(async () => {
					await dev.lockup.depositToProperty(property3.address, 16250 * 0.6, {
						from: alice,
					})
					await forwardBlockTimestamp(3)
				})
				it(`Alice does staking 60% of the all Property's total lockups, Alice's share become ${
					1975000 / 26000
				}%, Bob's share become ${625000 / 26000}%`, async () => {
					const aliceProperty1Position =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceProperty1Balance = toBigNumber(
						aliceProperty1Position.amount,
					)
					const aliceProperty3Position =
						await dev.sTokensManager.positions(aliceSecoundTokenId)
					const aliceProperty3Balance = toBigNumber(
						aliceProperty3Position.amount,
					)
					const bobProperty2Position =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobProperty2Balance = toBigNumber(bobProperty2Position.amount)

					expect(19750).to.be.equal(
						toBigNumber(26000).times(toBigNumber(19750).div(26000)).toNumber(),
					)
					expect(
						aliceProperty1Balance.plus(aliceProperty3Balance).toFixed(),
					).to.be.equal('19750')
					expect(6250).to.be.equal(
						toBigNumber(26000).times(toBigNumber(6250).div(26000)).toNumber(),
					)
					expect(bobProperty2Balance.toFixed()).to.be.equal('6250')
				})
			})
			describe('after additional staking', () => {
				it(`Alice's withdrawable interest is 80% of two prev interest and ${
					1000000 / 16250
				}% of prev interest and ${
					1975000 / 26000
				}% of current interest`, async () => {
					const aliceAmount = await Promise.all([
						dev.lockup
							.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
							.then(toBigNumber),
						dev.lockup
							.calculateWithdrawableInterestAmountByPosition(
								aliceSecoundTokenId,
							)
							.then(toBigNumber),
					])
					const res1 = await calc(aliceFirstTokenId)
					const res2 = await calc(aliceSecoundTokenId)

					expect(aliceAmount[0].plus(aliceAmount[1]).toFixed()).to.be.equal(
						toBigNumber(res1).plus(res2).toFixed(),
					)
				})
				it(`Bob's withdrawable interest is 20% of two prev interest and ${
					625000 / 16250
				}% of prev interest and ${
					625000 / 26000
				}% of current interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
			describe('after withdrawal stakes', () => {
				before(async () => {
					const aliceProperty1Position =
						await dev.sTokensManager.positions(aliceFirstTokenId)
					const aliceProperty1Balance = toBigNumber(
						aliceProperty1Position.amount,
					)
					const aliceProperty3Position =
						await dev.sTokensManager.positions(aliceSecoundTokenId)
					const aliceProperty3Balance = toBigNumber(
						aliceProperty3Position.amount,
					)
					const bobProperty2Position =
						await dev.sTokensManager.positions(bobFirstTokenId)
					const bobProperty2Balance = toBigNumber(bobProperty2Position.amount)
					await dev.lockup.withdrawByPosition(
						aliceFirstTokenId,
						aliceProperty1Balance,
						{
							from: alice,
						},
					)
					await forwardBlockTimestamp(3)
					await dev.lockup.withdrawByPosition(
						aliceSecoundTokenId,
						aliceProperty3Balance,
						{
							from: alice,
						},
					)
					await forwardBlockTimestamp(3)
					await dev.lockup.withdrawByPosition(
						bobFirstTokenId,
						bobProperty2Balance,
						{
							from: bob,
						},
					)
					await forwardBlockTimestamp(3)
				})
				it(`Alice's withdrawable interest`, async () => {
					const aliceAmount = await Promise.all([
						dev.lockup
							.calculateWithdrawableInterestAmountByPosition(aliceFirstTokenId)
							.then(toBigNumber),
						dev.lockup
							.calculateWithdrawableInterestAmountByPosition(
								aliceSecoundTokenId,
							)
							.then(toBigNumber),
					])
					const res1 = await calc(aliceFirstTokenId)
					const res2 = await calc(aliceSecoundTokenId)

					expect(aliceAmount[0].plus(aliceAmount[1]).toFixed()).to.be.equal(
						toBigNumber(res1).plus(res2).toFixed(),
					)
				})
				it(`Bob's withdrawable interest`, async () => {
					const bobAmount = await dev.lockup
						.calculateWithdrawableInterestAmountByPosition(bobFirstTokenId)
						.then(toBigNumber)
					const expected = await calc(bobFirstTokenId)

					expect(bobAmount.toFixed()).to.be.equal(expected)
				})
			})
		})
	})
})
