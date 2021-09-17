import {
	AddressRegistryInstance,
	PolicyFactoryInstance,
} from '../../../types/truffle-contracts'

export const generatePolicyFactoryInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<PolicyFactoryInstance> => {
	const policyFactory = await artifacts.require('PolicyFactory').new()
	console.log(`new Policy Factory Logic:${policyFactory.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new Policy Factory Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(policyFactory.address, admin.address, tmp)
	console.log(`new Policy Factory proxy:${proxy.address}`)
	const policyFactoryContract = artifacts.require('PolicyFactory')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const policyFactoryProxy = await policyFactoryContract.at(proxy.address)
	await policyFactoryProxy.initialize(addressRegistry.address)
	return policyFactoryProxy
}

export const setPolicyFactoryAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	policyFactoryProxyInstances: PolicyFactoryInstance
): Promise<void> => {
	await addressRegistry.setRegistry(
		'PolicyFactory',
		policyFactoryProxyInstances.address
	)
	console.log(
		`set Policy Factory proxy to registory:${policyFactoryProxyInstances.address}`
	)
}
