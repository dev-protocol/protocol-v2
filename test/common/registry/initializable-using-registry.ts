import { DevProtocolInstance } from '../../test-lib/instance'
import { validateErrorMessage } from '../../test-lib/utils/error'

contract('InitializableUsingRegistry', ([deployer]) => {
	const initializableUsingRegistryContract = artifacts.require(
		'InitializableUsingRegistryTest'
	)
	const dev = new DevProtocolInstance(deployer)
	before(async () => {
		await dev.generateAddressRegistry()
		await dev.generateDev()
	})
	describe('InitializableUsingRegistry; __UsingRegistry_init', () => {
		it('Set the AddressRegistry address with __UsingRegistry_init', async () => {
			const contract = await initializableUsingRegistryContract.new()
			await contract.__UsingRegistry_init_test(dev.addressRegistry.address)
			const tokenAddress = await contract.getToken()

			expect(tokenAddress).to.be.equal(
				await dev.addressRegistry.registries('Dev')
			)
		})

		it('Should fail to call __UsingRegistry_init if the second and subsequent calls', async () => {
			const contract = await initializableUsingRegistryContract.new()
			await contract.__UsingRegistry_init_test(dev.addressRegistry.address)
			const res = await contract
				.__UsingRegistry_init_test(dev.addressRegistry.address)
				.catch((err: Error) => err)

			validateErrorMessage(
				res,
				'Initializable: contract is already initialized'
			)
		})
	})
	describe('UsingRegistry; registryAddress', () => {
		it('Returns the AddressRegistry address', async () => {
			const contract = await initializableUsingRegistryContract.new()
			await contract.__UsingRegistry_init_test(dev.addressRegistry.address)

			const registryAddress = await contract.registryAddress()

			expect(registryAddress).to.be.equal(dev.addressRegistry.address)
		})
	})
})
