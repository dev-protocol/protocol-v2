import {
	AddressRegistryInstance,
	PropertyFactoryInstance,
} from '../../../types/truffle-contracts'

export const generatePropertyFactoryInstances =
	async (): Promise<PropertyFactoryInstance> => {
		const propertyFactory = await artifacts.require('PropertyFactory').new()
		console.log(`new Property Factory Logic:${propertyFactory.address}`)
		const admin = await artifacts.require('Admin').new()
		console.log(`new Property Factory Admin:${admin.address}`)
		const tmp = web3.utils.hexToBytes('0x')
		const proxy = await artifacts
			.require('Proxy')
			.new(propertyFactory.address, admin.address, tmp)
		console.log(`new Property Factory proxy:${proxy.address}`)
		const propertyFactoryContract = artifacts.require('PropertyFactory')
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const propertyFactoryProxy = await propertyFactoryContract.at(proxy.address)
		return propertyFactoryProxy
	}

export const setPropertyFactoryAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	propertyFactoryProxyInstances: PropertyFactoryInstance
): Promise<void> => {
	await addressRegistry.setRegistry(
		'PropertyFactory',
		propertyFactoryProxyInstances.address
	)
	console.log(
		`set Property Factory proxy to registory:${propertyFactoryProxyInstances.address}`
	)
}
