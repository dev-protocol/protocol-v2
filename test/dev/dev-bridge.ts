/* eslint-disable new-cap */
import { deployProxy, DevProtocolInstance } from '../test-lib/instance'
import { DevInstance, DevBridgeInstance } from '../../types/truffle-contracts'
import { validateErrorMessage } from '../test-lib/utils/error'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'

contract('DevBridge', ([deployer, user1, lockup, withdraw, market]) => {
	const createDevInstance = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevBridge()
		await dev.generateMarketFactory()
		await dev.addressRegistry.setRegistry('Lockup', lockup)
		await dev.addressRegistry.setRegistry('Withdraw', withdraw)
		await dev.marketFactory.__addMarket(market)
		return dev
	}

	const createDevInstanceNotAddRole = async (): Promise<
		[DevInstance, DevBridgeInstance]
	> => {
		const contract = artifacts.require

		const [addressRegistry] = await deployProxy(
			contract('AddressRegistry'),
			deployer
		)
		await addressRegistry.initialize()

		const [dev] = await deployProxy(contract('Dev'), deployer)
		await dev.__Dev_init('Dev')
		await addressRegistry.setRegistry('Dev', dev.address, {
			from: deployer,
		})

		const [marketFactory] = await deployProxy(
			contract('MarketFactoryTest'),
			deployer
		)
		await marketFactory.initialize(addressRegistry.address)
		await marketFactory.__addMarket(market)
		await addressRegistry.setRegistry('MarketFactory', marketFactory.address, {
			from: deployer,
		})

		const [devBridge] = await deployProxy(contract('DevBridge'), deployer)
		await devBridge.initialize(addressRegistry.address)

		await addressRegistry.setRegistry('Lockup', lockup, {
			from: deployer,
		})
		await addressRegistry.setRegistry('Withdraw', withdraw, {
			from: deployer,
		})
		return [dev, devBridge]
	}

	let dev: DevProtocolInstance
	let devInstance: DevInstance
	let devBridge: DevBridgeInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		dev = await createDevInstance()
		;[devInstance, devBridge] = await createDevInstanceNotAddRole()
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

	describe('mint', () => {
		describe('success', () => {
			it('If devBridge has minter privileges, it can mint Dev tokens.(Lockup)', async () => {
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devBridge.mint(user1, 100, { from: lockup })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
			it('If devBridge has minter privileges, it can mint Dev tokens.(withdraw)', async () => {
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devBridge.mint(user1, 100, { from: withdraw })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
		})
		describe('fail', () => {
			it('If devBridge does not has minter privileges, it can not mint Dev tokens', async () => {
				const result = await devBridge
					.mint(user1, 100, { from: withdraw })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have minter role to mint')
			})
			it('Error when minting from other than Lockup and Withdraw contracts', async () => {
				const result = await dev.devBridge
					.mint(user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
		})
	})
	describe('burn', () => {
		describe('success', () => {
			it('If devBridge has burner privileges, it can burn Dev tokens.(MarketFactory)', async () => {
				await dev.dev.mint(user1, 100)
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('100')
				await dev.devBridge.burn(user1, 100, { from: market })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('0')
			})
		})
		describe('fail', () => {
			it('If devBridge does not has minter privileges, it can not mint Dev tokens', async () => {
				await devInstance.mint(user1, 100)
				const result = await devBridge
					.burn(user1, 100, { from: market })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have burner role to burn')
			})
			it('Error when minting from other than MarketFactory contracts', async () => {
				await dev.dev.mint(user1, 100)
				const result = await dev.devBridge
					.mint(user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
		})
	})
	describe('renounceMinter', () => {
		describe('success', () => {
			it('we can remove mint privileges.', async () => {
				const role = await dev.dev.MINTER_ROLE()
				const before = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(before).to.equal(true)
				await dev.devBridge.renounceMinter()
				const after = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(after).to.equal(false)
				const result = await dev.devBridge
					.mint(user1, 100, { from: withdraw })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have minter role to mint')
			})
		})
		describe('fail', () => {
			it('Only the owner can run it.', async () => {
				const result = await dev.devBridge
					.renounceMinter({ from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Ownable: caller is not the owner')
			})
		})
	})
	describe('renounceBurner', () => {
		describe('success', () => {
			it('we can remove burn privileges.', async () => {
				const role = await dev.dev.BURNER_ROLE()
				const before = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(before).to.equal(true)
				await dev.devBridge.renounceBurner()
				const after = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(after).to.equal(false)
				const result = await dev.devBridge
					.burn(user1, 100, { from: market })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have burner role to burn')
			})
		})
		describe('fail', () => {
			it('Only the owner can run it.', async () => {
				const result = await dev.devBridge
					.renounceBurner({ from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Ownable: caller is not the owner')
			})
		})
	})
})
