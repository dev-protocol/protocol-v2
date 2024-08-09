/* eslint-disable max-nested-callbacks */
import { init } from './withdraw-common'
import type { DevProtocolInstance } from '../test-lib/instance'
import type {
	PropertyInstance,
	WithdrawInstance,
} from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import {
	toBigNumber,
	splitValue,
	forwardBlockTimestamp,
	getBlockTimestamp,
	getBlock,
} from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import { DEFAULT_ADDRESS, SHARE_OF_TREASURY } from '../test-lib/const'
import type { Snapshot } from '../test-lib/utils/snapshot'
import { takeSnapshot, revertToSnapshot } from '../test-lib/utils/snapshot'
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
				await dev.lockup.depositToProperty(
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
				await dev.lockup.depositToProperty(
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
				await dev.lockup.depositToProperty(
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
			await dev.lockup.depositToProperty(
				property1.address,
				toBigNumber(1000000000),
				{
					from: alis,
				}
			)
			await dev.lockup.depositToProperty(
				property2.address,
				toBigNumber(2000000000),
				{
					from: alis,
				}
			)
			await dev.lockup.depositToProperty(
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
	describe.only('Withdraw; TransferHistory', () => {
		const Alice = deployer
		const Bob = user1
		const Carol = user3
		const toStruct = (
			src: any
		): {
			to: string
			from: string
			amount: BigNumber
			sourceOfRecipient: BigNumber
			sourceOfSender: BigNumber
			fill: boolean
			blockNumber: BigNumber
		} => {
			const [
				to,
				from,
				amount,
				sourceOfRecipient,
				sourceOfSender,
				fill,
				blockNumber,
			] = src
			return {
				to,
				from,
				amount: toBigNumber(amount),
				sourceOfRecipient: toBigNumber(sourceOfRecipient),
				sourceOfSender: toBigNumber(sourceOfSender),
				fill,
				blockNumber: toBigNumber(blockNumber),
			}
		}

		it('should be empty by default', async () => {
			const data = await dev.withdraw.transferHistory(property.address, 0)
			const res = toStruct(data)
			expect(res.amount.toNumber()).to.be.equal(0)
			expect(res.sourceOfSender.toNumber()).to.be.equal(0)
			expect(res.sourceOfRecipient.toNumber()).to.be.equal(0)
			expect(res.blockNumber.toNumber()).to.be.equal(0)
			expect(res.to).to.be.equal(DEFAULT_ADDRESS)
			expect(res.from).to.be.equal(DEFAULT_ADDRESS)
			expect(res.fill).to.be.equal(false)
		})
		it('should create new TransferHistory each transfer', async () => {
			const balance1 = await property.balanceOf(Alice).then(toBigNumber)
			const balance2 = await property.balanceOf(Bob).then(toBigNumber)
			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const block1 = await getBlock()
			const data1 = await dev.withdraw.transferHistory(property.address, 0)
			const balance3 = await property.balanceOf(Bob).then(toBigNumber)
			const balance4 = await property.balanceOf(Carol).then(toBigNumber)
			await property.transfer(Carol, '500000', {
				from: Bob,
			})
			const block2 = await getBlock()
			const data2 = await dev.withdraw.transferHistory(property.address, 1)

			const res1 = toStruct(data1)
			expect(res1.amount.toNumber()).to.be.equal(0) // Initially, it's 0
			expect(res1.sourceOfSender.toFixed()).to.be.equal(balance1.toFixed())
			expect(res1.sourceOfRecipient.toFixed()).to.be.equal(balance2.toFixed())
			expect(res1.blockNumber.toNumber()).to.be.equal(block1)
			expect(res1.to).to.be.equal(Bob)
			expect(res1.from).to.be.equal(Alice)
			expect(res1.fill).to.be.equal(false)

			const res2 = toStruct(data2)
			expect(res2.amount.toNumber()).to.be.equal(0) // Initially, it's 0
			expect(res2.sourceOfSender.toFixed()).to.be.equal(balance3.toFixed())
			expect(res2.sourceOfRecipient.toFixed()).to.be.equal(balance4.toFixed())
			expect(res2.blockNumber.toNumber()).to.be.equal(block2)
			expect(res2.to).to.be.equal(Carol)
			expect(res2.from).to.be.equal(Bob)
			expect(res2.fill).to.be.equal(false)
		})
		it('should update `amount` and `fill` of the last one TransferHistory', async () => {
			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const d1 = await dev.withdraw.transferHistory(property.address, 0)
			const r1 = toStruct(d1)
			expect(r1.amount.toFixed()).to.be.equal('0')
			expect(r1.fill).to.be.equal(false)

			await property.transfer(Carol, '500000', {
				from: Bob,
			})
			const d2 = await dev.withdraw.transferHistory(property.address, 0)
			const r2 = toStruct(d2)
			expect(r2.amount.toFixed()).to.be.equal('1000000')
			expect(r2.fill).to.be.equal(true)
		})
		it('should increase trasnferHistoryLength each transfer', async () => {
			expect(
				(
					await dev.withdraw
						.transferHistoryLength(property.address)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('0')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistoryLength(property.address)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('1')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistoryLength(property.address)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('2')
		})
		it('should increase trasnferHistorySenderLength each transfer', async () => {
			expect(
				(
					await dev.withdraw
						.transferHistorySenderLength(property.address, Alice)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('0')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistorySenderLength(property.address, Alice)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('1')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistorySenderLength(property.address, Alice)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('2')
		})
		it('should increase transferHistoryRecipientLength each transfer', async () => {
			expect(
				(
					await dev.withdraw
						.transferHistoryRecipientLength(property.address, Bob)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('0')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistoryRecipientLength(property.address, Bob)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('1')

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			expect(
				(
					await dev.withdraw
						.transferHistoryRecipientLength(property.address, Bob)
						.then(toBigNumber)
				).toFixed()
			).to.be.equal('2')
		})
		it('should record TransferHistory ID in transferHistorySender', async () => {
			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const id1 = await dev.withdraw.transferHistorySender(
				property.address,
				Alice,
				0
			)
			const r1 = await dev.withdraw
				.transferHistory(property.address, id1)
				.then(toStruct)
			expect(r1.from).to.be.equal(Alice)

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const id2 = await dev.withdraw.transferHistorySender(
				property.address,
				Alice,
				1
			)
			const r2 = await dev.withdraw
				.transferHistory(property.address, id2)
				.then(toStruct)
			expect(r2.from).to.be.equal(Alice)
		})
		it('should record TransferHistory ID in transferHistoryRecipient', async () => {
			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const id1 = await dev.withdraw.transferHistoryRecipient(
				property.address,
				Bob,
				0
			)
			const r1 = await dev.withdraw
				.transferHistory(property.address, id1)
				.then(toStruct)
			expect(r1.to).to.be.equal(Bob)

			await property.transfer(Bob, '1000000', {
				from: Alice,
			})
			const id2 = await dev.withdraw.transferHistoryRecipient(
				property.address,
				Bob,
				1
			)
			const r2 = await dev.withdraw
				.transferHistory(property.address, id2)
				.then(toStruct)
			expect(r2.to).to.be.equal(Bob)
		})
		describe('Scenario', () => {
			let Prop1: PropertyInstance
			let Prop2: PropertyInstance
			let Prop3: PropertyInstance
			let withdraw: WithdrawInstance

			before((done) => {
				;(async () => {
					const [dev] = await init(deployer, user3)
					withdraw = dev.withdraw
					const properties = await Promise.all([
						artifacts
							.require('Property')
							.at(
								getPropertyAddress(
									await dev.propertyFactory.create('test1', 'TEST1', Alice)
								)
							),
						artifacts
							.require('Property')
							.at(
								getPropertyAddress(
									await dev.propertyFactory.create('test2', 'TEST2', Alice)
								)
							),
						artifacts
							.require('Property')
							.at(
								getPropertyAddress(
									await dev.propertyFactory.create('test3', 'TEST3', Alice)
								)
							),
					])
					Prop1 = properties[0]
					Prop2 = properties[1]
					Prop3 = properties[2]
					done()
				})()
			})

			describe('Alice -> Bob: Prop1', () => {
				let balanceAlice: BigNumber
				let balanceBob: BigNumber
				let blockNumber: number
				before((done) => {
					;(async () => {
						balanceAlice = await Prop1.balanceOf(Alice).then(toBigNumber)
						balanceBob = await Prop1.balanceOf(Bob).then(toBigNumber)
						await Prop1.transfer(Bob, '100000', { from: Alice })
						blockNumber = await getBlock()
						done()
					})()
				})
				it('TransferHistory for Prop1 is created 1', async () => {
					const [r1] = await Promise.all([
						withdraw.transferHistoryLength(Prop1.address).then(toBigNumber),
					])
					expect(r1.toFixed()).to.be.equal('1')
				})
				it('TransferHistory for Prop2, Prop3 is not created', async () => {
					const [r1, r2] = await Promise.all([
						withdraw.transferHistoryLength(Prop2.address).then(toBigNumber),
						withdraw.transferHistoryLength(Prop3.address).then(toBigNumber),
					])
					expect(r1.toFixed()).to.be.equal('0')
					expect(r2.toFixed()).to.be.equal('0')
				})
				it('TransferHistorySender for Prop1:Alice is created 1', async () => {
					const [r1] = await Promise.all([
						withdraw
							.transferHistorySenderLength(Prop1.address, Alice)
							.then(toBigNumber),
					])
					expect(r1.toFixed()).to.be.equal('1')
				})
				it('TransferHistoryRecipient for Prop1:Bob is created 1', async () => {
					const [r1] = await Promise.all([
						withdraw
							.transferHistoryRecipientLength(Prop1.address, Bob)
							.then(toBigNumber),
					])
					expect(r1.toFixed()).to.be.equal('1')
				})
				it('TransferHistoryRecipient for Prop1:Alice, TransferHistorySender for Prop1:Bob are not created', async () => {
					const [r1, r2] = await Promise.all([
						withdraw
							.transferHistorySenderLength(Prop1.address, Bob)
							.then(toBigNumber),
						withdraw
							.transferHistoryRecipientLength(Prop1.address, Alice)
							.then(toBigNumber),
					])
					expect(r1.toFixed()).to.be.equal('0')
					expect(r2.toFixed()).to.be.equal('0')
				})
				it('TransferHistory for Prop1 has expected values', async () => {
					const [r1] = await Promise.all([
						withdraw.transferHistory(Prop1.address, 0).then(toStruct),
					])
					expect(r1.from).to.be.equal(Alice)
					expect(r1.to).to.be.equal(Bob)
					expect(r1.amount.toFixed()).to.be.equal('0')
					expect(r1.sourceOfSender.toFixed()).to.be.equal(
						balanceAlice.toFixed()
					)
					expect(r1.sourceOfRecipient.toFixed()).to.be.equal(
						balanceBob.toFixed()
					)
					expect(r1.fill).to.be.equal(false)
					expect(r1.blockNumber.toNumber()).to.be.equal(blockNumber)
				})
			})
		})
	})
})
