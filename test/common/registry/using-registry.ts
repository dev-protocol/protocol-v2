import { DevProtocolInstance } from '../../test-lib/instance'

contract('UsingRegistryTest', ([deployer]) => {
	const usingRegistryContract = artifacts.require('Using≈Test')
	const dev = new DevProtocolInstance(deployer)
	before(async () => {
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevMinter()
	})
	describe('UsingRegistry; registry', () => {
		it('You can get the address of registry by setting it in the constructor.', async () => {
			const usingRegistryTest = await usingRegistryContract.new(
				dev.addressRegistry.address,
				{ from: deployer }
			)
			const tokenAddress = await usingRegistryTest.getToken()

			expect(tokenAddress).to.be.equal(
				await dev.addressRegistry.registries('Dev')
			)
		})
	})
	describe('UsingRegistry; registryAddress', () => {
		it('You can get the address of registry.', async () => {
			const usingRegistryTest = await usingRegistryContract.new(
				dev.addressRegistry.address,
				{ from: deployer }
			)
			const registryAddress = await usingRegistryTest.registryAddress()

			expect(registryAddress).to.be.equal(dev.addressRegistry.address)
		})
	})
})
