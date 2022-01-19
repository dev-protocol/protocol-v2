import { DevProtocolInstance } from '../../test-lib/instance'
import { validateErrorMessage, errorCatch } from '../../test-lib/utils/error'
import { DEFAULT_ADDRESS } from '../../test-lib/const'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../../test-lib/utils/snapshot'

contract(
	'AddressRegistryTest',
	([deployer, other, setAddress1, setAddress2]) => {
		describe('AddressRegistry; setRegistry/registries', () => {
			const init = async (): Promise<DevProtocolInstance> => {
				const dev = new DevProtocolInstance(deployer)
				await dev.generateAddressRegistry()
				return dev
			}

			let dev: DevProtocolInstance
			let snapshot: Snapshot
			let snapshotId: string

			before(async () => {
				dev = await init()
			})

			beforeEach(async () => {
				snapshot = (await takeSnapshot()) as Snapshot
				snapshotId = snapshot.result
			})

			afterEach(async () => {
				await revertToSnapshot(snapshotId)
			})

			describe('success', () => {
				it('get default value', async () => {
					const addresss = await dev.addressRegistry.registries('dummy')
					expect(addresss).to.be.equal(DEFAULT_ADDRESS)
				})
				it('set address', async () => {
					await dev.addressRegistry.setRegistry('Allocator', setAddress1)
					const addresss = await dev.addressRegistry.registries('Allocator')
					expect(addresss).to.be.equal(setAddress1)
				})
				it('set policy address', async () => {
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
					const result = await dev.addressRegistry
						.setRegistry('Allocator', setAddress1, {
							from: other,
						})
						.catch(errorCatch)
					validateErrorMessage(result, 'this is illegal address')
				})
				it('Value set by non-PolicyFactory', async () => {
					const result = await dev.addressRegistry
						.setRegistry('Policy', setAddress1)
						.catch(errorCatch)
					validateErrorMessage(result, 'this is illegal address')
				})
			})
		})
	}
)
