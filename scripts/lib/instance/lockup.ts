import {
	AddressRegistryInstance,
	LockupInstance,
} from '../../../types/truffle-contracts'

export const generateLockupInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<LockupInstance> => {
	const lockup = await artifacts.require('Lockup').new()
	console.log(`new Lockup Logic:${lockup.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new Lockup Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(lockup.address, admin.address, tmp)
	console.log(`new Lockup proxy:${proxy.address}`)
	const lockupContract = artifacts.require('Lockup')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const lockupProxy = await lockupContract.at(proxy.address)
	await lockupProxy.initialize(addressRegistry.address)
	return lockupProxy
}

export const setLockupAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	lockupProxyInstances: LockupInstance
): Promise<void> => {
	await addressRegistry.setRegistry('Lockup', lockupProxyInstances.address)
	console.log(`set Lockup proxy to registory:${lockupProxyInstances.address}`)
}
