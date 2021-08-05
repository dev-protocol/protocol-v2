import { DevProtocolInstance } from '../../test-lib/instance'
import { validateErrorMessage, errorCatch } from '../../test-lib/utils/error'
import { DEFAULT_ADDRESS } from '../../test-lib/const'

contract(
	'AddressRegistryTest',
	([deployer, other, setAddress1, setAddress2]) => {
		describe('AddressRegistry; setRegistry/registries', () => {
			const init = async (): Promise<DevProtocolInstance> => {
				const dev = new DevProtocolInstance(deployer)
				await dev.generateAddressRegistry()
				return dev
			}

			describe('success', () => {
				it('get default value', async () => {
					const dev = await init()
					const addresss = await dev.addressRegistry.registries('dummy')
					expect(addresss).to.be.equal(DEFAULT_ADDRESS)
				})
				it('set address', async () => {
					const dev = await init()
					await dev.addressRegistry.setRegistry('Allocator', setAddress1)
					const addresss = await dev.addressRegistry.registries('Allocator')
					expect(addresss).to.be.equal(setAddress1)
				})
				it('set policy address', async () => {
					const dev = await init()
					await dev.addressRegistry.setRegistry('PolicyFactory', setAddress1)
					await dev.addressRegistry.setRegistry('Policy', setAddress2, {
						from: setAddress1,
					})
					const addresss = await dev.addressRegistry.registries('Policy')
					expect(addresss).to.be.equal(setAddress2)
				})
			})
			describe('fail', () => {
				it('Value set by non-owner', async () => {
					const dev = await init()
					const result = await dev.addressRegistry
						.setRegistry('Allocator', setAddress1, {
							from: other,
						})
						.catch(errorCatch)
					validateErrorMessage(result, 'this is illegal address')
				})
				it('Value set by non-PolicyFactory', async () => {
					const dev = await init()
					const result = await dev.addressRegistry
						.setRegistry('Policy', setAddress1)
						.catch(errorCatch)
					validateErrorMessage(result, 'this is illegal address')
				})
			})
		})
	}
)
