import {
	AddressRegistryInstance,
	WithdrawInstance,
} from '../../../types/truffle-contracts'

export const generateWithdrawInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<WithdrawInstance> => {
	const withdraw = await artifacts.require('Withdraw').new()
	console.log(`new Withdraw Logic:${withdraw.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new Withdraw Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(withdraw.address, admin.address, tmp)
	console.log(`new Withdraw proxy:${proxy.address}`)
	const withdrawContract = artifacts.require('Withdraw')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const withdrawProxy = await withdrawContract.at(proxy.address)
	await withdrawProxy.initialize(addressRegistry.address)
	return withdrawProxy
}

export const setWithdrawAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	withdrawProxyInstances: WithdrawInstance
): Promise<void> => {
	await addressRegistry.setRegistry('Withdraw', withdrawProxyInstances.address)
	console.log(
		`set Withdraw proxy to registory:${withdrawProxyInstances.address}`
	)
}
