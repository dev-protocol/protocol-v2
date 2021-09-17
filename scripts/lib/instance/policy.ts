import {
	AddressRegistryInstance,
	IPolicyInstance,
} from '../../../types/truffle-contracts'

export const generatePolicyInstance = async (
	addressRegistry: AddressRegistryInstance,
	policyName: string
): Promise<IPolicyInstance> => {
	const policy: IPolicyInstance = await artifacts
		.require(policyName)
		.new(addressRegistry.address)
	console.log(`new Plocy:${policy.address} name:${policyName}`)
	return policy
}

export const setPolicyAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	policyInstances: IPolicyInstance
): Promise<void> => {
	await addressRegistry.setRegistry('Policy', policyInstances.address)
	console.log(`set policy to registory:${policyInstances.address}`)
}
