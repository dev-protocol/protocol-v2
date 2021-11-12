import {
	Policy1Instance,
	CurveTestInstance,
} from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { toBigNumber } from '../test-lib/utils/common'
import BigNumber from 'bignumber.js'

contract('Policy1', ([deployer]) => {
	let policy: Policy1Instance
	let curve: CurveTestInstance
	let dev: DevProtocolInstance
	const max = new BigNumber('132000000000000').div(15).integerValue()

	before(async () => {
		dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateSTokensManager()
		await dev.generateLockup()
		await dev.dev.mint(deployer, new BigNumber(1e18).times(10000000))
		policy = await artifacts
			.require('Policy1')
			.new(dev.addressRegistry.address, max, 0)
		curve = await artifacts.require('CurveTest').new()
	})

	describe('Policy1; rewards', () => {
		const totalSupply = new BigNumber(1e18).times(10000000)
		const createRandom = () => {
			const staked = totalSupply.times(Math.random()).integerValue()
			const assets = new BigNumber(Math.random()).times(1e4).integerValue()
			return [staked.toFixed(), assets.toFixed()]
		}

		it('Correct curve', async () => {
			const random1 = createRandom()
			const random2 = createRandom()
			const random3 = createRandom()
			const random4 = createRandom()
			const random5 = createRandom()
			const random6 = createRandom()
			console.log({ random1, random2, random3, random4, random5, random6 })

			const result1 = await policy
				.rewards(random1[0], random1[1])
				.then(toBigNumber)
			const result2 = await policy
				.rewards(random2[0], random2[1])
				.then(toBigNumber)
			const result3 = await policy
				.rewards(random3[0], random3[1])
				.then(toBigNumber)
			const result4 = await policy
				.rewards(random4[0], random4[1])
				.then(toBigNumber)
			const result5 = await policy
				.rewards(random5[0], random5[1])
				.then(toBigNumber)
			const result6 = await policy
				.rewards(random6[0], random6[1])
				.then(toBigNumber)

			const expected1 = await curve
				.curveRewardsTest(random1[0], random1[1], totalSupply, max)
				.then(toBigNumber)
			const expected2 = await curve
				.curveRewardsTest(random2[0], random2[1], totalSupply, max)
				.then(toBigNumber)
			const expected3 = await curve
				.curveRewardsTest(random3[0], random3[1], totalSupply, max)
				.then(toBigNumber)
			const expected4 = await curve
				.curveRewardsTest(random4[0], random4[1], totalSupply, max)
				.then(toBigNumber)
			const expected5 = await curve
				.curveRewardsTest(random5[0], random5[1], totalSupply, max)
				.then(toBigNumber)
			const expected6 = await curve
				.curveRewardsTest(random6[0], random6[1], totalSupply, max)
				.then(toBigNumber)

			expect(result1.toString()).to.be.equal(expected1.toString())
			expect(result2.toString()).to.be.equal(expected2.toString())
			expect(result3.toString()).to.be.equal(expected3.toString())
			expect(result4.toString()).to.be.equal(expected4.toString())
			expect(result5.toString()).to.be.equal(expected5.toString())
			expect(result6.toString()).to.be.equal(expected6.toString())
		})
		it('constructing mintPerSecondAndAsset', async () => {
			const contract = await artifacts
				.require('Policy1')
				.new(dev.addressRegistry.address, '1234567890', 0)
			const random = createRandom()

			const result = await contract
				.rewards(random[0], random[1])
				.then(toBigNumber)

			const expected = await curve
				.curveRewardsTest(random[0], random[1], totalSupply, '1234567890')
				.then(toBigNumber)

			expect(result.toString()).to.be.equal(expected.toString())
		})
		it('constructing presumptiveAssets', async () => {
			const contract = await artifacts
				.require('Policy1')
				.new(dev.addressRegistry.address, max, 1000)
			const random = createRandom()

			const result1 = await contract.rewards(random[0], 999).then(toBigNumber)
			const result2 = await contract.rewards(random[0], 1000).then(toBigNumber)
			const result3 = await contract.rewards(random[0], 1001).then(toBigNumber)

			const expected1 = await curve
				.curveRewardsTest(random[0], 1000, totalSupply, max)
				.then(toBigNumber)
			const expected2 = await curve
				.curveRewardsTest(random[0], 1000, totalSupply, max)
				.then(toBigNumber)
			const expected3 = await curve
				.curveRewardsTest(random[0], 1001, totalSupply, max)
				.then(toBigNumber)

			expect(result1.toString()).to.be.equal(expected1.toString())
			expect(result2.toString()).to.be.equal(expected2.toString())
			expect(result3.toString()).to.be.equal(expected3.toString())
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
			expect(result.toString()).to.be.equal('432000')
		})
	})
	describe('Policy1; policyVotingSeconds', () => {
		it('Returns the number of the blocks of the voting period for the new Policy', async () => {
			const result = await policy.policyVotingSeconds()
			expect(result.toString()).to.be.equal('432000')
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
})
