import {
	AddressRegistryInstance,
	DevInstance,
} from '../../../types/truffle-contracts'

export const generateDevInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<DevInstance> => {
	const dev = await artifacts.require('Dev').new()
	console.log(`new Dev Logic:${dev.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new Dev Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(dev.address, admin.address, tmp)
	console.log(`new Dev proxy:${proxy.address}`)
	const devContract = artifacts.require('Dev')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const devProxy = await devContract.at(proxy.address)
	await devProxy.initializeDev(addressRegistry.address)
	return devProxy
}

export const setDevAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	devProxyInstance: DevInstance
): Promise<void> => {
	await addressRegistry.setRegistry('Dev', devProxyInstance.address)
	console.log(`set Dev proxy to registory:${devProxyInstance.address}`)
}
