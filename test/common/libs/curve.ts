import { CurveTestInstance } from '../../../types/truffle-contracts'
import { toBigNumber } from '../../test-lib/utils/common'
import BigNumber from 'bignumber.js'

contract('Curve', () => {
	let curve: CurveTestInstance
	const totalSupply = new BigNumber(1e18).times(10000000)
	const max = new BigNumber('132000000000000').div(15).integerValue()

	before(async () => {
		curve = await artifacts.require('CurveTest').new()
	})

	describe('curveRewards', () => {
		const rewards = (
			stake: BigNumber,
			_asset: BigNumber,
			totalSupply: BigNumber,
			_max: BigNumber
		): BigNumber => {
			// Rewards = Max*(1-StakingRate)^((12-(StakingRate*10))/2+1)
			const stakingRate = new BigNumber(stake).div(totalSupply)
			const asset = _asset.times(new BigNumber(1).minus(stakingRate))
			const max = _max.times(asset)
			const _d = new BigNumber(1).minus(stakingRate)
			const _p = new BigNumber(12).minus(stakingRate.times(10)).div(2).plus(1)
			const p = Math.floor(_p.toNumber())
			const rp = p + 1
			const f = _p.minus(p)
			const d1 = _d.pow(p)
			const d2 = _d.pow(rp)
			const g = d1.minus(d2).times(f)
			const d = d1.minus(g)
			const expected = new BigNumber(max).times(d)
			return expected.integerValue(BigNumber.ROUND_DOWN)
		}

		it('Returns the total number of mint per second when the total number of lockups and the total number of assets is passed', async () => {
			const stake = new BigNumber(1e18).times(220000)
			const result = await curve.curveRewardsTest(stake, 1, totalSupply, max)
			const expected = rewards(stake, new BigNumber(1), totalSupply, max)
			expect(result.toString()).to.be.equal(expected.toString())
		})
		it('Returns 0.0000088 when zero staked and one asset', async () => {
			const result = await curve.curveRewardsTest(0, 1, totalSupply, max)
			expect(result.toString()).to.be.equal('8800000000000')
			expect(
				new BigNumber(result.toString()).div(new BigNumber(1e18)).toString()
			).to.be.equal('0.0000088')
		})
		it('Depends staking rate, decrease the impact of assets', async () => {
			const assets = new BigNumber(2000)
			const natural = (i: BigNumber): BigNumber => i.div(new BigNumber(1e18))
			const per1010 = new BigNumber(1e18).times(1010000)
			const per2170 = new BigNumber(1e18).times(2170000)
			const per9560 = new BigNumber(1e18).times(9560000)
			const result1 = await curve
				.curveRewardsTest(per1010, assets, totalSupply, max)
				.then(toBigNumber)
			const result2 = await curve
				.curveRewardsTest(per2170, assets, totalSupply, max)
				.then(toBigNumber)
			const result3 = await curve
				.curveRewardsTest(per9560, assets, totalSupply, max)
				.then(toBigNumber)

			expect(result1.toString()).to.be.equal('7935173026534157')
			expect(result2.toString()).to.be.equal('3250550847356926')
			expect(result3.toString()).to.be.equal('1183918579712')
			expect(natural(result1).toString()).to.be.equal('0.007935173026534157')
			expect(natural(result2).toString()).to.be.equal('0.003250550847356926')
			expect(natural(result3).toString()).to.be.equal('0.000001183918579712')
			expect(rewards(per1010, assets, totalSupply, max).toString()).to.be.equal(
				'7935173026534157'
			)
			expect(rewards(per2170, assets, totalSupply, max).toString()).to.be.equal(
				'3250550847356926'
			)
			expect(rewards(per9560, assets, totalSupply, max).toString()).to.be.equal(
				'1183918579712'
			)
		})
		it('Will be correct curve', async () => {
			const one = new BigNumber(1)
			const natural = (i: BigNumber): BigNumber => i.div(new BigNumber(1e18))
			const per199 = new BigNumber(1e18).times(1990000)
			const per200 = new BigNumber(1e18).times(2000000)
			const per201 = new BigNumber(1e18).times(2010000)
			const result1 = await curve
				.curveRewardsTest(per199, 1, totalSupply, max)
				.then(toBigNumber)
			const result2 = await curve
				.curveRewardsTest(per200, 1, totalSupply, max)
				.then(toBigNumber)
			const result3 = await curve
				.curveRewardsTest(per201, 1, totalSupply, max)
				.then(toBigNumber)

			expect(result1.toString()).to.be.equal('1859850117979')
			expect(result2.toString()).to.be.equal('1845493760000')
			expect(result3.toString()).to.be.equal('1831707186636')
			expect(natural(result1).toString()).to.be.equal('0.000001859850117979')
			expect(natural(result2).toString()).to.be.equal('0.00000184549376')
			expect(natural(result3).toString()).to.be.equal('0.000001831707186636')
			expect(rewards(per199, one, totalSupply, max).toString()).to.be.equal(
				'1859850117979'
			)
			expect(rewards(per200, one, totalSupply, max).toString()).to.be.equal(
				'1845493760000'
			)
			expect(rewards(per201, one, totalSupply, max).toString()).to.be.equal(
				'1831707186636'
			)
		})
		it('When a number of stakes are 0', async () => {
			const result = await curve.curveRewardsTest(0, 99999, totalSupply, max)
			const expected = rewards(
				new BigNumber(0),
				new BigNumber(99999),
				totalSupply,
				max
			)
			expect(result.toString()).to.be.equal(expected.toString())
		})
		it('Returns 0 when the number of assets is 0', async () => {
			const stake = new BigNumber(1e18).times(220000)
			const result = await curve.curveRewardsTest(stake, 0, totalSupply, max)
			expect(result.toString()).to.be.equal('0')
		})
		it('Returns 0 when the staking rate is 100%', async () => {
			const stake = new BigNumber(1e18).times(10000000)
			const result = await curve.curveRewardsTest(
				stake,
				99999,
				totalSupply,
				max
			)
			expect(result.toString()).to.be.equal('0')
		})
	})
})
