import {
	AddressRegistryInstance,
	STokensManagerInstance,
} from '../../../types/truffle-contracts'

export const generateSTokensManagerInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<STokensManagerInstance> => {
	const sTokensManager = await artifacts.require('STokensManager').new()
	console.log(`new STokensManager Logic:${sTokensManager.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new STokensManager Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(sTokensManager.address, admin.address, tmp)
	console.log(`new STokensManager proxy:${proxy.address}`)
	const sTokensManagerContract = artifacts.require('STokensManager')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const sTokensManagerProxy = await sTokensManagerContract.at(proxy.address)
	await sTokensManagerProxy.initialize(addressRegistry.address)
	return sTokensManagerProxy
}

export const setSTokensManagerAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	sTokensManagerProxyInstances: STokensManagerInstance
): Promise<void> => {
	await addressRegistry.setRegistry(
		'STokensManager',
		sTokensManagerProxyInstances.address
	)
	console.log(
		`set STokensManager proxy to registory:${sTokensManagerProxyInstances.address}`
	)
}
