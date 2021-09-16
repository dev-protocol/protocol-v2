import {
	AddressRegistryInstance,
	ProxyInstance,
	AdminInstance,
} from '../../../types/truffle-contracts'

export const generate = async (): Promise<
	[AddressRegistryInstance, ProxyInstance, AdminInstance]
> => {
	const addressReg = await artifacts.require('AddressRegistry').new()
	console.log(`new AddressRegistry Logic:${addressReg.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new AddressRegistry Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(addressReg.address, admin.address, tmp)
	console.log(`new AddressRegistry proxy:${proxy.address}`)
	return [addressReg, proxy, admin]
}

export const load = async (
	addressRegistryProxy: ProxyInstance
): Promise<AddressRegistryInstance> => {
	const addressRegContract = artifacts.require('AddressRegistry')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const addressRegProxy = await addressRegContract.at(
		addressRegistryProxy.address
	)
	console.log(`load AddressRegistry proxy:${addressRegistryProxy.address}`)
	return addressRegProxy
}

export const changeLogic = async (
	addressRegistryProxy: ProxyInstance,
	addressRegistryAdmin: AdminInstance
): Promise<void> => {
	const currentAddressReg = await addressRegistryAdmin.getProxyImplementation(
		addressRegistryProxy.address
	)
	console.log(`old AddressRegistry Logic:${currentAddressReg}`)
	const addressReg = await artifacts.require('AddressRegistry').new()
	console.log(`new AddressRegistry Logic:${addressReg.address}`)
	await addressRegistryAdmin.upgrade(
		addressRegistryProxy.address,
		addressReg.address
	)
}
