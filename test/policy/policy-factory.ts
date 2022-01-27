import { IPolicyInstance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import {
	collectsEth,
	forwardBlockTimestamp,
	getBlockTimestamp,
} from '../test-lib/utils/common'
import {
	revertToSnapshot,
	Snapshot,
	takeSnapshot,
} from '../test-lib/utils/snapshot'
import {
	validateNotOwnerErrorMessage,
	validateAddressErrorMessage,
	validateErrorMessage,
} from '../test-lib/utils/error'

contract('PolicyFactory', ([deployer, dummyPolicy, user1, ...accounts]) => {
	before(async () => {
		await collectsEth(deployer)(accounts)
	})
	const init = async (): Promise<[DevProtocolInstance, IPolicyInstance]> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()

		await dev.generatePolicyFactory()
		await dev.generateMarketFactory()

		const policy = await dev.getPolicy('PolicyTestForPolicyFactory', user1)
		return [dev, policy]
	}

	let dev: DevProtocolInstance
	let policy: IPolicyInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		;[dev, policy] = await init()
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

	describe('PolicyFactory; create', () => {
		it('If the first Policy, the Policy becomes valid.', async () => {
			await dev.policyFactory.create(policy.address, {
				from: user1,
			})
			const curentPolicyAddress = await dev.addressRegistry.registries('Policy')
			expect(curentPolicyAddress).to.be.equal(policy.address)
		})

		it('Shoud be updated isPotentialPolicy', async () => {
			const before = await dev.policyFactory.isPotentialPolicy(policy.address)
			expect(before).to.be.equal(false)
			await dev.policyFactory.create(policy.address, {
				from: user1,
			})
			const after = await dev.policyFactory.isPotentialPolicy(policy.address)
			expect(after).to.be.equal(true)
		})
		it('Should emit Create event', async () => {
			const result = await dev.policyFactory.create(policy.address, {
				from: user1,
			})
			const event = result.logs[0].args as { _from: string; _policy: string }
			expect(result.logs[0].event).to.be.equal('Create')
			expect(event._from).to.be.equal(user1)
			expect(event._policy).to.be.equal(policy.address)
		})
		it('Shoud be updated closeVoteAt', async () => {
			const policyVotingSeconds = 10 // From PolicyTestForPolicyFactory.sol
			const before = await dev.policyFactory.closeVoteAt(policy.address)
			expect(before.toNumber()).to.be.equal(0)
			await dev.policyFactory.create(policy.address, {
				from: user1,
			})
			const ts = await getBlockTimestamp()
			const after = await dev.policyFactory.closeVoteAt(policy.address)
			expect(after.toNumber()).to.be.equal(ts + policyVotingSeconds)
		})
	})
	describe('PolicyFactory; forceAttach', () => {
		describe('failed', () => {
			it('can not be performed by anyone other than the owner.', async () => {
				const result = await dev.policyFactory
					.forceAttach(dummyPolicy, { from: user1 })
					.catch((err: Error) => err)
				validateNotOwnerErrorMessage(result)
			})
			it('can not specify anything other than policy.', async () => {
				const result = await dev.policyFactory
					.forceAttach(dummyPolicy)
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('deadline is over.', async () => {
				await dev.policyFactory.create(policy.address, {
					from: user1,
				})
				const secoundPolicy = await dev.getPolicy(
					'PolicyTestForPolicyFactory',
					user1
				)
				await dev.policyFactory.create(secoundPolicy.address, {
					from: user1,
				})
				let curentPolicyAddress = await dev.addressRegistry.registries('Policy')
				expect(curentPolicyAddress).to.be.equal(policy.address)
				await forwardBlockTimestamp(10)
				const result = await dev.policyFactory
					.forceAttach(secoundPolicy.address)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'deadline is over')
				curentPolicyAddress = await dev.addressRegistry.registries('Policy')
				expect(curentPolicyAddress).to.be.equal(policy.address)
			})
		})
		describe('success', () => {
			it('policy is force attach.', async () => {
				await dev.policyFactory.create(policy.address, {
					from: user1,
				})
				const secoundPolicy = await dev.getPolicy(
					'PolicyTestForPolicyFactory',
					user1
				)
				await dev.policyFactory.create(secoundPolicy.address, {
					from: user1,
				})
				let curentPolicyAddress = await dev.addressRegistry.registries('Policy')
				expect(curentPolicyAddress).to.be.equal(policy.address)

				await dev.policyFactory.forceAttach(secoundPolicy.address)

				curentPolicyAddress = await dev.addressRegistry.registries('Policy')
				expect(curentPolicyAddress).to.be.equal(secoundPolicy.address)
			})
		})
	})
})
