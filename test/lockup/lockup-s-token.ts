import { deployerBalance, err, init, init2 } from './lockup-s-token-common'
import { DevProtocolInstance } from '../test-lib/instance'
import { PropertyInstance } from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import {
	toBigNumber,
	forwardBlockTimestamp,
	getBlockTimestamp,
} from '../test-lib/utils/common'
import { getPropertyAddress } from '../test-lib/utils/log'
import { getEventValue } from '../test-lib/utils/event'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('LockupTest', ([deployer, user1, user2, user3]) => {
	let dev: DevProtocolInstance
	let property: PropertyInstance
	let tokenId: number
	let snapshot: Snapshot
	let snapshotId: string

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

    describe('Lockup; depositToProperty, getLockedupProperties', () => {
		before(async () => {
			[dev, property] = await init(deployer, user2)
		})
		describe('success', () => {
			it('get nft token.', async () => {
				await dev.dev.approve(dev.lockup.address, 100)
				await dev.lockup.depositToProperty(property.address, 100)
				const owner = await dev.sTokensManager.ownerOf(1)
				expect(owner).to.be.equal(deployer)
				const position = await dev.sTokensManager.positions(1)
				expect(position.property).to.be.equal(property.address)
				expect(toBigNumber(position.amount).toNumber()).to.be.equal(100)
				expect(toBigNumber(position.price).toNumber()).to.be.equal(0)
				expect(toBigNumber(position.cumulativeReward).toNumber()).to.be.equal(0)
				expect(toBigNumber(position.pendingReward).toNumber()).to.be.equal(0)
			})
			it('get 2 nft token.', async () => {
				await dev.dev.approve(dev.lockup.address, 100)
				await dev.lockup.depositToProperty(property.address, 100)
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				await dev.dev.approve(dev.lockup.address, 200)
				await dev.lockup.depositToProperty(property.address, 200)
				const t2 = await getBlockTimestamp()
				const owner = await dev.sTokensManager.ownerOf(2)
				expect(owner).to.be.equal(deployer)
				const position = await dev.sTokensManager.positions(2)
				expect(position.property).to.be.equal(property.address)
				expect(toBigNumber(position.amount).toNumber()).to.be.equal(200)
				expect(toBigNumber(position.price).toFixed()).to.be.equal(
					toBigNumber('100000000000000000000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(toBigNumber(position.cumulativeReward).toNumber()).to.be.equal(0)
				expect(toBigNumber(position.pendingReward).toNumber()).to.be.equal(0)
			})
			it('get lockup info.', async () => {
				let info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(0)
				await dev.dev.approve(dev.lockup.address, 100)
				await dev.lockup.depositToProperty(property.address, 100)
				info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(property.address)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(100)
			})
			it('get lockup info plus value.', async () => {
				await dev.dev.approve(dev.lockup.address, 300)
				await dev.lockup.depositToProperty(property.address, 100)
				await dev.lockup.depositToProperty(property.address, 200)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(property.address)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(300)
			})
			it('get lockup info maltible value.', async () => {
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test2', 'TEST2', user2, {
						from: user2,
					})
				)
				await dev.metricsFactory.__addMetrics(
					(
						await dev.createMetrics(deployer, propertyAddress)
					).address
				)
				await dev.dev.approve(dev.lockup.address, 300)
				await dev.lockup.depositToProperty(property.address, 100)
				await dev.lockup.depositToProperty(propertyAddress, 200)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(2)
				for (const lockupInfo of info) {
					if (lockupInfo.property === property.address) {
						expect(toBigNumber(lockupInfo.value).toNumber()).to.be.equal(100)
					} else if (lockupInfo.property === propertyAddress) {
						expect(toBigNumber(lockupInfo.value).toNumber()).to.be.equal(200)
					}
				}
			})
			it('generate event.', async () => {
				await dev.dev.approve(dev.lockup.address, 100)
				dev.lockup.depositToProperty(property.address, 100)
				const [_from, _property, _value, _tokenId] = await Promise.all([
					getEventValue(dev.lockup)('Lockedup', '_from'),
					getEventValue(dev.lockup)('Lockedup', '_property'),
					getEventValue(dev.lockup)('Lockedup', '_value'),
					getEventValue(dev.lockup)('Lockedup', '_tokenId'),
				])
				expect(_from).to.be.equal(deployer)
				expect(_property).to.be.equal(property.address)
				expect(_value).to.be.equal('100')
				expect(_tokenId).to.be.equal('1')
			})
			it('set storage value.', async () => {
				await dev.dev.approve(dev.lockup.address, 100)
				await dev.lockup.depositToProperty(property.address, 100)
				const allValue = await dev.lockup.totalLocked()
				expect(allValue.toString()).to.be.equal('100')
				const propertyValue = await dev.lockup.totalLockedForProperty(
					property.address
				)
				expect(propertyValue.toString()).to.be.equal('100')
			})
			it('staking dev token.', async () => {
				await dev.dev.approve(dev.lockup.address, 100)
				const beforeBalance = await dev.dev
					.balanceOf(deployer)
					.then(toBigNumber)
				const beforePropertyBalance = await dev.dev.balanceOf(property.address)
				expect(beforeBalance.toString()).to.be.equal(deployerBalance.toString())
				expect(beforePropertyBalance.toString()).to.be.equal('0')
				await dev.lockup.depositToProperty(property.address, 100)
				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const afterPropertyBalance = await dev.dev.balanceOf(property.address)
				expect(afterBalance.toString()).to.be.equal(
					deployerBalance.minus(100).toString()
				)
				expect(afterPropertyBalance.toString()).to.be.equal('100')
			})
		})
		describe('fail', () => {
			it('Attempt to deposit money into an unauthenticated property.', async () => {
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test2', 'TEST2', user2, {
						from: user2,
					})
				)
				const res = await dev.lockup
					.depositToProperty(propertyAddress, 100)
					.catch(err)
				validateErrorMessage(res, 'unable to stake to unauthenticated property')
			})
			it('0 dev staking is not possible.', async () => {
				const res = await dev.lockup
					.depositToProperty(property.address, 0)
					.catch(err)
				validateErrorMessage(res, 'illegal deposit amount')
			})
			it('user is not holding dev.', async () => {
				const res = await dev.lockup
					.depositToProperty(property.address, 100, { from: user3 })
					.catch(err)
				validateErrorMessage(res, 'ERC20: transfer amount exceeds balance')
			})
		})
	})
	describe('Lockup; depositToPosition', () => {
		before(async () => {
			[dev, property, tokenId] = await init2(deployer, user2)
		})
		describe('success', () => {
			it('update nft.', async () => {
				const t1 = await getBlockTimestamp()
				const beforePosition = await dev.sTokensManager.positions(tokenId)
				expect(beforePosition.property).to.be.equal(property.address)
				expect(toBigNumber(beforePosition.amount).toNumber()).to.be.equal(100)
				expect(toBigNumber(beforePosition.price).toNumber()).to.be.equal(0)
				expect(
					toBigNumber(beforePosition.cumulativeReward).toNumber()
				).to.be.equal(0)
				expect(
					toBigNumber(beforePosition.pendingReward).toNumber()
				).to.be.equal(0)
				await forwardBlockTimestamp(2)
				await dev.lockup.depositToPosition(tokenId, 100)
				const t2 = await getBlockTimestamp()
				const afterPosition = await dev.sTokensManager.positions(tokenId)
				expect(afterPosition.property).to.be.equal(property.address)
				expect(toBigNumber(afterPosition.amount).toNumber()).to.be.equal(200)
				expect(toBigNumber(afterPosition.price).toFixed()).to.be.equal(
					toBigNumber('100000000000000000000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(
					toBigNumber(afterPosition.cumulativeReward).toFixed()
				).to.be.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(toBigNumber(afterPosition.pendingReward).toFixed()).to.be.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
			})
			it('generate event.', async () => {
				dev.lockup.depositToPosition(tokenId, 300)
				const [_from, _property, _value, _tokenId] = await Promise.all([
					getEventValue(dev.lockup)('Lockedup', '_from'),
					getEventValue(dev.lockup)('Lockedup', '_property'),
					getEventValue(dev.lockup)('Lockedup', '_value'),
					getEventValue(dev.lockup)('Lockedup', '_tokenId'),
				])
				expect(_from).to.be.equal(deployer)
				expect(_property).to.be.equal(property.address)
				expect(_value).to.be.equal('300')
				expect(_tokenId).to.be.equal('1')
			})
			it('set storage value.', async () => {
				await dev.lockup.depositToPosition(tokenId, 300)
				const allValue = await dev.lockup.totalLocked()
				expect(allValue.toString()).to.be.equal('400')
				const propertyValue = await dev.lockup.totalLockedForProperty(
					property.address
				)
				expect(propertyValue.toString()).to.be.equal('400')
			})
			it('staking dev token.', async () => {
				const beforeBalance = await dev.dev
					.balanceOf(deployer)
					.then(toBigNumber)
				const beforePropertyBalance = await dev.dev.balanceOf(property.address)
				expect(beforeBalance.toString()).to.be.equal(
					deployerBalance.minus(100).toString()
				)
				expect(beforePropertyBalance.toString()).to.be.equal('100')
				await dev.lockup.depositToPosition(tokenId, 300)
				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const afterPropertyBalance = await dev.dev.balanceOf(property.address)
				expect(afterBalance.toString()).to.be.equal(
					deployerBalance.minus(100).minus(300).toString()
				)
				expect(afterPropertyBalance.toString()).to.be.equal('400')
			})
			it('get lockup info.', async () => {
				await dev.lockup.depositToPosition(tokenId, 300)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(property.address)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(400)
			})
			it('get lockup info plus value.', async () => {
				await dev.lockup.depositToPosition(tokenId, 300)
				await dev.lockup.depositToPosition(tokenId, 200)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(property.address)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(600)
			})
			it('get lockup info maltible value.', async () => {
				await dev.lockup.depositToPosition(tokenId, 300)
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test2', 'TEST2', user2, {
						from: user2,
					})
				)
				await dev.metricsFactory.__addMetrics(
					(
						await dev.createMetrics(deployer, propertyAddress)
					).address
				)
				await dev.lockup.depositToProperty(propertyAddress, 200)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(2)
				for (const lockupInfo of info) {
					if (lockupInfo.property === property.address) {
						expect(toBigNumber(lockupInfo.value).toNumber()).to.be.equal(400)
					} else if (lockupInfo.property === propertyAddress) {
						expect(toBigNumber(lockupInfo.value).toNumber()).to.be.equal(200)
					}
				}
			})
		})
		describe('fail', () => {
			it('Cannot update position if sender and owner are different.', async () => {
				const res = await dev.lockup
					.depositToPosition(tokenId, 100, { from: user3 })
					.catch(err)
				validateErrorMessage(res, 'illegal sender')
			})
			it('0 dev staking is not possible.', async () => {
				const res = await dev.lockup.depositToPosition(tokenId, 0).catch(err)
				validateErrorMessage(res, 'illegal deposit amount')
			})
			it('user is not holding dev.', async () => {
				const res = await dev.lockup.depositToPosition(tokenId, 1000).catch(err)
				validateErrorMessage(res, 'ERC20: transfer amount exceeds allowance')
			})
		})
	})
	describe('Lockup; withdrawByPosition', () => {
		before(async () => {
			[dev, property, tokenId] = await init2(deployer, user2)
		})
		describe('success', () => {
			it('update nft position.', async () => {
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const beforePosition = await dev.sTokensManager.positions(tokenId)
				expect(beforePosition.property).to.be.equal(property.address)
				expect(toBigNumber(beforePosition.amount).toNumber()).to.be.equal(100)
				expect(toBigNumber(beforePosition.price).toNumber()).to.be.equal(0)
				expect(
					toBigNumber(beforePosition.cumulativeReward).toNumber()
				).to.be.equal(0)
				expect(
					toBigNumber(beforePosition.pendingReward).toNumber()
				).to.be.equal(0)
				await dev.lockup.withdrawByPosition(tokenId, 100)
				const t2 = await getBlockTimestamp()
				const afterPosition = await dev.sTokensManager.positions(tokenId)
				expect(afterPosition.property).to.be.equal(property.address)
				expect(toBigNumber(afterPosition.amount).toNumber()).to.be.equal(0)
				expect(toBigNumber(afterPosition.price).toFixed()).to.be.equal(
					toBigNumber('100000000000000000000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(
					toBigNumber(afterPosition.cumulativeReward).toFixed()
				).to.be.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(
					toBigNumber(beforePosition.pendingReward).toNumber()
				).to.be.equal(0)
			})
			it('generate event.', async () => {
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				dev.lockup.withdrawByPosition(tokenId, 100)
				const [_from, _property, _value, _reward, _tokenId] = await Promise.all(
					[
						getEventValue(dev.lockup)('Withdrew', '_from'),
						getEventValue(dev.lockup)('Withdrew', '_property'),
						getEventValue(dev.lockup)('Withdrew', '_value'),
						getEventValue(dev.lockup)('Withdrew', '_reward'),
						getEventValue(dev.lockup)('Withdrew', '_tokenId'),
					]
				)
				expect(_from).to.be.equal(deployer)
				expect(_property).to.be.equal(property.address)
				expect(_value).to.be.equal('100')
				const t2 = await getBlockTimestamp()
				const reward = toBigNumber('10000000000000000000')
					.times(t2 - t1)
					.toFixed()
				expect(_reward).to.be.equal(reward)
				expect(_tokenId).to.be.equal(String(tokenId))
			})
			it('get reward.', async () => {
				const t1 = await getBlockTimestamp()
				const beforeBalance = await dev.dev
					.balanceOf(deployer)
					.then(toBigNumber)
				await forwardBlockTimestamp(1)
				await dev.lockup.withdrawByPosition(tokenId, 0)
				const t2 = await getBlockTimestamp()
				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const reward = afterBalance.minus(beforeBalance)
				expect(reward.toString()).to.be.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
			})
			it('reverce staking dev token.', async () => {
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const beforeBalance = await dev.dev
					.balanceOf(deployer)
					.then(toBigNumber)
				await dev.lockup.withdrawByPosition(tokenId, 100)
				const t2 = await getBlockTimestamp()
				const afterBalance = await dev.dev.balanceOf(deployer).then(toBigNumber)
				const rewardPlusStakedDev = afterBalance.minus(beforeBalance)
				const stakedDev = rewardPlusStakedDev.minus(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(stakedDev.toString()).to.be.equal('100')
			})
			it('set storage value.', async () => {
				await dev.lockup.withdrawByPosition(tokenId, 100)
				const allValue = await dev.lockup.totalLocked()
				expect(allValue.toString()).to.be.equal('0')
				const propertyValue = await dev.lockup.totalLockedForProperty(
					property.address
				)
				expect(propertyValue.toString()).to.be.equal('0')
			})
			it('get lockup info.', async () => {
				await dev.lockup.withdrawByPosition(tokenId, 100)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(0)
			})
			it('get lockup info(minus).', async () => {
				await dev.lockup.withdrawByPosition(tokenId, 50)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(property.address)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(50)
			})
			it('get lockup info maltible value.', async () => {
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test2', 'TEST2', user2, {
						from: user2,
					})
				)
				await dev.metricsFactory.__addMetrics(
					(
						await dev.createMetrics(deployer, propertyAddress)
					).address
				)
				await dev.lockup.depositToProperty(propertyAddress, 200)
				await dev.lockup.withdrawByPosition(tokenId, 100)
				const info = await dev.lockup.getLockedupProperties()
				expect(info.length).to.be.equal(1)
				expect(info[0].property).to.be.equal(propertyAddress)
				expect(toBigNumber(info[0].value).toNumber()).to.be.equal(200)
			})
		})
		describe('fail', () => {
			it('Cannot withdraw reward if sender and owner are different.', async () => {
				const res = await dev.lockup
					.withdrawByPosition(tokenId, 100, { from: user3 })
					.catch(err)
				validateErrorMessage(res, 'illegal sender')
			})
			it('Withdrawal amount is greater than deposit amount.', async () => {
				const res = await dev.lockup.withdrawByPosition(tokenId, 200).catch(err)
				validateErrorMessage(res, 'insufficient tokens staked')
			})
		})
	})
})
