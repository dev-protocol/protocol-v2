import { AddressRegistryInstance } from '../../../types/truffle-contracts'

export const generateAddressRegistryInstances =
	async (): Promise<AddressRegistryInstance> => {
		const addressReg = await artifacts.require('AddressRegistry').new()
		console.log(`new AddressRegistry Logic:${addressReg.address}`)
		const admin = await artifacts.require('Admin').new()
		console.log(`new AddressRegistry Admin:${admin.address}`)
		const tmp = web3.utils.hexToBytes('0x')
		const proxy = await artifacts
			.require('Proxy')
			.new(addressReg.address, admin.address, tmp)
		console.log(`new AddressRegistry proxy:${proxy.address}`)
		const addressRegContract = artifacts.require('AddressRegistry')
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const addressRegProxy = await addressRegContract.at(proxy.address)
		return addressRegProxy
	}

export const loadAddressRegistryInstance = async (
	addressRegistryProxy: string
): Promise<AddressRegistryInstance> => {
	const addressRegContract = artifacts.require('AddressRegistry')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const addressRegProxy = await addressRegContract.at(addressRegistryProxy)
	console.log(`load AddressRegistry proxy:${addressRegistryProxy}`)
	return addressRegProxy
}
