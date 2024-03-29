import type BigNumber from 'bignumber.js'

contract('Policy', () => {
	const policyContract = artifacts.require('PolicyTest1')
	let policy: any
	beforeEach(async () => {
		policy = await policyContract.new()
	})
	describe('PolicyTest1; rewards', () => {
		it('Returns the total number of mint per block when the total number of lockups and the total number of assets is passed', async () => {
			const result = (await policy.rewards(45, 76)) as BigNumber
			expect(result.toNumber()).to.be.equal(121)
		})
	})
	describe('PolicyTest1; holdersShare', () => {
		it('Returns the reward that the Property holders can receive when the reward per Property and the number of locked-ups is passed', async () => {
			const result = (await policy.holdersShare(10000, 700)) as BigNumber
			expect(result.toNumber()).to.be.equal(9346)
		})
	})
	describe('PolicyTest1; authenticationFee', () => {
		it('Returns the authentication fee when the total number of assets and the number of lockups is passed', async () => {
			const result = (await policy.authenticationFee(1000, 100)) as BigNumber
			expect(result.toNumber()).to.be.equal(1099)
		})
	})
	describe('PolicyTest1; marketVotingSeconds', () => {
		it('Returns the number of the blocks of the voting period for the new Market', async () => {
			const result = (await policy.marketVotingSeconds()) as BigNumber
			expect(result.toNumber()).to.be.equal(10)
		})
	})
	describe('PolicyTest1; policyVotingSeconds', () => {
		it('Returns the number of the blocks of the voting period for the new Policy', async () => {
			const result = (await policy.policyVotingSeconds()) as BigNumber
			expect(result.toNumber()).to.be.equal(20)
		})
	})
	describe('PolicyTest1; shareOfTreasury', () => {
		it('Returns the number of the share treasury', async () => {
			const result = (await policy.shareOfTreasury(100)) as BigNumber
			expect(result.toNumber()).to.be.equal(5)
		})
	})
})
