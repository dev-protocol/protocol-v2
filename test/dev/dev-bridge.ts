/* eslint-disable new-cap */
import { deployProxy, DevProtocolInstance } from '../test-lib/instance'
import {
	DevInstance,
	DevBridgeInstance,
	MarketFactoryInstance,
} from '../../types/truffle-contracts'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('DevBridge', ([deployer, user1, lockup, withdraw]) => {
	const contract = artifacts.require

	const createDevInstance = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevBridge()
		await dev.generateMarketFactory()
		await dev.generatePolicyFactory()
		await dev.addressRegistry.setRegistry('Lockup', lockup)
		await dev.addressRegistry.setRegistry('Withdraw', withdraw)
		const policy = await dev.getPolicy('PolicyTest1', user1)
		await dev.policyFactory.create(policy.address, { from: user1 })
		const market = await dev.getMarket('MarketTest1', user1)
		await dev.marketFactory.create(market.address, {
			from: user1,
		})
		return dev
	}

	const createDevInstanceNotAddRole = async (): Promise<
		[DevInstance, DevBridgeInstance, MarketFactoryInstance]
	> => {
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
			contract('MarketFactory'),
			deployer
		)
		await marketFactory.initialize(addressRegistry.address)
		await addressRegistry.setRegistry('MarketFactory', marketFactory.address, {
			from: deployer,
		})

		const policy = await contract('PolicyTest1').new()
		const [policyFactory] = await deployProxy(
			contract('PolicyFactory'),
			deployer
		)
		await policyFactory.initialize(addressRegistry.address)
		await addressRegistry.setRegistry('PolicyFactory', policyFactory.address, {
			from: deployer,
		})
		await policyFactory.create(policy.address)
		const market = await contract('MarketTest1').new(addressRegistry.address, {
			from: deployer,
		})
		await marketFactory.create(market.address, {
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
		return [dev, devBridge, marketFactory]
	}

	describe('mint', () => {
		describe('success', () => {
			it('If devBridge has minter privileges, it can mint Dev tokens.(Lockup)', async () => {
				const dev = await createDevInstance()
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devBridge.mint(user1, 100, { from: lockup })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
			it('If devBridge has minter privileges, it can mint Dev tokens.(withdraw)', async () => {
				const dev = await createDevInstance()
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devBridge.mint(user1, 100, { from: withdraw })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
		})
		describe('fail', () => {
			it('If devBridge does not has minter privileges, it can not mint Dev tokens', async () => {
				const [, devBridge] = await createDevInstanceNotAddRole()
				const result = await devBridge
					.mint(user1, 100, { from: withdraw })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have minter role to mint')
			})
			it('Error when minting from other than Lockup and Withdraw contracts', async () => {
				const dev = await createDevInstance()
				const result = await dev.devBridge
					.mint(user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
		})
	})
	describe('burn', () => {
		describe('success', () => {
			it.only('If devBridge has burner privileges, it can burn Dev tokens.(MarketFactory)', async () => {
				const dev = await createDevInstance()
				await dev.dev.mint(user1, 100)
				console.log(1)
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('100')
				console.log(2)
				const marketAddress = await dev.marketFactory.getEnabledMarkets()
				console.log(marketAddress)
				const marketInstance = await contract('MarketTest1').at(
					marketAddress[0]
				)
				console.log(dev.devBridge.address)
				console.log(marketInstance)
				await marketInstance.burnTest(dev.devBridge.address, user1, 100)
				console.log(4)
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('0')
			})
		})
		describe('fail', () => {
			it('If devBridge does not has minter privileges, it can not mint Dev tokens', async () => {
				const [dev, devBridge, marketFactory] =
					await createDevInstanceNotAddRole()
				await dev.mint(user1, 100)
				const marketAddress = (await marketFactory.getEnabledMarkets())[0]
				const marketInstance = await contract('MarketTest1').at(marketAddress)
				const result = await marketInstance
					.burnTest(devBridge.address, user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have burner role to burn')
			})
			it('Error when minting from other than MarketFactory contracts', async () => {
				const dev = await createDevInstance()
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
				const dev = await createDevInstance()
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
				const dev = await createDevInstance()
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
				const dev = await createDevInstance()
				const role = await dev.dev.BURNER_ROLE()
				const before = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(before).to.equal(true)
				await dev.devBridge.renounceBurner()
				const after = await dev.dev.hasRole(role, dev.devBridge.address)
				expect(after).to.equal(false)
				const marketAddress = (await dev.marketFactory.getEnabledMarkets())[0]
				const marketInstance = await contract('MarketTest1').at(marketAddress)
				const result = await marketInstance
					.burnTest(dev.devBridge.address, user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'must have burner role to burn')
			})
		})
		describe('fail', () => {
			it('Only the owner can run it.', async () => {
				const dev = await createDevInstance()
				const result = await dev.devBridge
					.renounceBurner({ from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Ownable: caller is not the owner')
			})
		})
	})
})
