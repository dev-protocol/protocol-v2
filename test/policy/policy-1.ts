import { Policy1Instance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { toBigNumber } from '../test-lib/utils/common'
import { DEFAULT_ADDRESS } from '../test-lib/const'
import BigNumber from 'bignumber.js'
import { validateNotOwnerErrorMessage } from '../test-lib/utils/error'

contract('Policy1', ([deployer, treasury, capSetter, user]) => {
	let policy: Policy1Instance
	let dev: DevProtocolInstance

	before(async () => {
		dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevMinter()
		await dev.generateSTokensManager()
		await dev.generateLockup()
		await dev.dev.mint(deployer, new BigNumber(1e18).times(10000000))
		policy = await artifacts.require('Policy1').new(dev.addressRegistry.address)
	})

	describe('Policy1; rewards', () => {
		const rewards = (stake: BigNumber, _asset: BigNumber): BigNumber => {
			// Rewards = Max*(1-StakingRate)^((12-(StakingRate*10))/2+1)
			const totalSupply = new BigNumber(1e18).times(10000000)
			const stakingRate = new BigNumber(stake).div(totalSupply)
			const asset = _asset.times(new BigNumber(1).minus(stakingRate))
			const max = new BigNumber('132000000000000').times(asset)
			const _d = new BigNumber(1).minus(stakingRate)
			const _p = new BigNumber(12).minus(stakingRate.times(10)).div(2).plus(1)
			const p = ~~_p.toNumber()
			const rp = p + 1
			const f = _p.minus(p)
			const d1 = _d.pow(p)
			const d2 = _d.pow(rp)
			const g = d1.minus(d2).times(f)
			const d = d1.minus(g)
			const expected = new BigNumber(max).times(d)
			return expected.integerValue(BigNumber.ROUND_DOWN)
		}

		it('Returns the total number of mint per block when the total number of lockups and the total number of assets is passed', async () => {
			const stake = new BigNumber(1e18).times(220000)
			const result = await policy.rewards(stake, 1)
			const expected = rewards(stake, new BigNumber(1))
			expect(result.toString()).to.be.equal(expected.toString())
		})
		it('Returns 0.000132 when zero staked and one asset', async () => {
			const result = await policy.rewards(0, 1)
			expect(result.toString()).to.be.equal('132000000000000')
			expect(
				new BigNumber(result.toString()).div(new BigNumber(1e18)).toString()
			).to.be.equal('0.000132')
		})
		it('Depends staking rate, decrease the impact of assets', async () => {
			const assets = new BigNumber(2000)
			const natural = (i: BigNumber): BigNumber => i.div(new BigNumber(1e18))
			const per1010 = new BigNumber(1e18).times(1010000)
			const per2170 = new BigNumber(1e18).times(2170000)
			const per9560 = new BigNumber(1e18).times(9560000)
			const result1 = await policy.rewards(per1010, assets).then(toBigNumber)
			const result2 = await policy.rewards(per2170, assets).then(toBigNumber)
			const result3 = await policy.rewards(per9560, assets).then(toBigNumber)

			expect(result1.toString()).to.be.equal('119027595398012362')
			expect(result2.toString()).to.be.equal('48758262710353901')
			expect(result3.toString()).to.be.equal('17758778695680')
			expect(natural(result1).toString()).to.be.equal('0.119027595398012362')
			expect(natural(result2).toString()).to.be.equal('0.048758262710353901')
			expect(natural(result3).toString()).to.be.equal('0.00001775877869568')
			expect(rewards(per1010, assets).toString()).to.be.equal(
				'119027595398012362'
			)
			expect(rewards(per2170, assets).toString()).to.be.equal(
				'48758262710353901'
			)
			expect(rewards(per9560, assets).toString()).to.be.equal('17758778695680')
		})
		it('Will be correct curve', async () => {
			const one = new BigNumber(1)
			const natural = (i: BigNumber): BigNumber => i.div(new BigNumber(1e18))
			const per199 = new BigNumber(1e18).times(1990000)
			const per200 = new BigNumber(1e18).times(2000000)
			const per201 = new BigNumber(1e18).times(2010000)
			const result1 = await policy.rewards(per199, 1).then(toBigNumber)
			const result2 = await policy.rewards(per200, 1).then(toBigNumber)
			const result3 = await policy.rewards(per201, 1).then(toBigNumber)

			expect(result1.toString()).to.be.equal('27897751769687')
			expect(result2.toString()).to.be.equal('27682406400000')
			expect(result3.toString()).to.be.equal('27475607799544')
			expect(natural(result1).toString()).to.be.equal('0.000027897751769687')
			expect(natural(result2).toString()).to.be.equal('0.0000276824064')
			expect(natural(result3).toString()).to.be.equal('0.000027475607799544')
			expect(rewards(per199, one).toString()).to.be.equal('27897751769687')
			expect(rewards(per200, one).toString()).to.be.equal('27682406400000')
			expect(rewards(per201, one).toString()).to.be.equal('27475607799544')
		})
		it('When a number of stakes are 0', async () => {
			const result = await policy.rewards(0, 99999)
			const expected = rewards(new BigNumber(0), new BigNumber(99999))
			expect(result.toString()).to.be.equal(expected.toString())
		})
		it('Returns 0 when the number of assets is 0', async () => {
			const stake = new BigNumber(1e18).times(220000)
			const result = await policy.rewards(stake, 0)
			expect(result.toString()).to.be.equal('0')
		})
		it('Returns 0 when the staking rate is 100%', async () => {
			const stake = new BigNumber(1e18).times(10000000)
			const result = await policy.rewards(stake, 99999)
			expect(result.toString()).to.be.equal('0')
		})
	})
	describe('Policy1; holdersShare', () => {
		it('Returns the reward that the Property holders can receive when the reward per Property and the number of locked-ups is passed', async () => {
			const result = await policy.holdersShare(1000000, 10000)
			expect(result.toString()).to.be.equal('510000')
		})
		it('The share is 51%', async () => {
			const result = await policy.holdersShare(1000000, 1)
			expect(result.toString()).to.be.equal(
				new BigNumber(1000000).times(0.51).toString()
			)
		})
		it('The share is 100% when lockup is 0', async () => {
			const result = await policy.holdersShare(1000000, 0)
			expect(result.toString()).to.be.equal('1000000')
		})
		it('Returns 0 when a passed reward is 0', async () => {
			const result = await policy.holdersShare(0, 99999999)
			expect(result.toString()).to.be.equal('0')
		})
	})
	describe('Policy1; authenticationFee', () => {
		it('Returns the authentication fee when the total number of assets and the number of lockups is passed', async () => {
			const result = await policy.authenticationFee(
				20000,
				new BigNumber(100000 * 1e18)
			)
			expect(result.toString()).to.be.equal('1')
		})
		it('Returns 1 when the number of assets is 10000, locked-ups is 0', async () => {
			const result = await policy.authenticationFee(10000, 0)
			expect(result.toString()).to.be.equal('1')
		})
		it('Returns 0 when the number of assets is 9999, locked-ups is 0', async () => {
			const result = await policy.authenticationFee(9999, 0)
			expect(result.toString()).to.be.equal('0')
		})
		it('Returns 500 when the number of assets is 5000000, locked-ups is 0', async () => {
			const result = await policy.authenticationFee(5000000, 0)
			expect(result.toString()).to.be.equal('500')
		})
		it('Returns 430 when the number of assets is 5000000, locked-ups is 7000000', async () => {
			const result = await policy.authenticationFee(
				5000000,
				new BigNumber(7000000 * 1e18)
			)
			expect(result.toString()).to.be.equal('430')
		})
		it('Returns 0 when the number of assets is 5000000, locked-ups is 50000000', async () => {
			const result = await policy.authenticationFee(
				5000000,
				new BigNumber(50000000 * 1e18)
			)
			expect(result.toString()).to.be.equal('0')
		})
		it('Returns 0 when the number of assets is 10000, locked-ups is 10000000', async () => {
			const result = await policy.authenticationFee(
				10000,
				new BigNumber(10000000 * 1e18)
			)
			expect(result.toString()).to.be.equal('0')
		})
	})
	describe('Policy1; marketVotingSeconds', () => {
		it('Returns the number of the blocks of the voting period for the new Market', async () => {
			const result = await policy.marketVotingSeconds()
			expect(result.toString()).to.be.equal('86400')
		})
	})
	describe('Policy1; policyVotingSeconds', () => {
		it('Returns the number of the blocks of the voting period for the new Policy', async () => {
			const result = await policy.policyVotingSeconds()
			expect(result.toString()).to.be.equal('86400')
		})
	})
	describe('Policy1; shareOfTreasury', () => {
		it("The Treasury's share (5%) comes back。", async () => {
			let result = await policy.shareOfTreasury(100)
			expect(result.toString()).to.be.equal('5')
			const value = new BigNumber(1e18).times(220000)
			result = await policy.shareOfTreasury(value)
			expect(result.toString()).to.be.equal(value.div(100).times(5).toFixed())
		})
		it('Return 0 when 0 is specified', async () => {
			const result = await policy.shareOfTreasury(0)
			expect(result.toString()).to.be.equal('0')
		})
	})
	describe('Policy1; treasury', () => {
		it('returns the treasury address.', async () => {
			await policy.setTreasury(treasury)
			const result = await policy.treasury()
			expect(result).to.be.equal(treasury)
		})
		it('the default value is 0 address.', async () => {
			const tmp = await artifacts
				.require('Policy1')
				.new(dev.addressRegistry.address)
			const result = await tmp.treasury()
			expect(result).to.be.equal(DEFAULT_ADDRESS)
		})
		it('No one but the owner can set the address.', async () => {
			const result = await policy
				.setTreasury(treasury, {
					from: user,
				})
				.catch((err: Error) => err)
			validateNotOwnerErrorMessage(result)
		})
	})
	describe('Policy1; capSetter', () => {
		it('returns the setter address.', async () => {
			await policy.setCapSetter(capSetter)
			const result = await policy.capSetter()
			expect(result).to.be.equal(capSetter)
		})
		it('the default value is 0 address.', async () => {
			const tmp = await artifacts
				.require('Policy1')
				.new(dev.addressRegistry.address)
			const result = await tmp.capSetter()
			expect(result).to.be.equal(DEFAULT_ADDRESS)
		})
		it('No one but the owner can set the address.', async () => {
			const result = await policy
				.setCapSetter(capSetter, {
					from: user,
				})
				.catch((err: Error) => err)
			validateNotOwnerErrorMessage(result)
		})
	})
})
