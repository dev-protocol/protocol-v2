import {
	AddressRegistryInstance,
	MetricsFactoryInstance,
} from '../../../types/truffle-contracts'

export const generateMetricsFactoryInstances = async (
	addressRegistry: AddressRegistryInstance
): Promise<MetricsFactoryInstance> => {
	const metricsFactory = await artifacts.require('MetricsFactory').new()
	console.log(`new Metrics Factory Logic:${metricsFactory.address}`)
	const admin = await artifacts.require('Admin').new()
	console.log(`new Metrics Factory Admin:${admin.address}`)
	const tmp = web3.utils.hexToBytes('0x')
	const proxy = await artifacts
		.require('Proxy')
		.new(metricsFactory.address, admin.address, tmp)
	console.log(`new Metrics Factory proxy:${proxy.address}`)
	const metricsFactoryContract = artifacts.require('MetricsFactory')
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const metricsFactoryProxy = await metricsFactoryContract.at(proxy.address)
	await metricsFactoryProxy.initialize(addressRegistry.address)
	return metricsFactoryProxy
}

export const setMetricsFactoryAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	metricsFactoryProxyInstances: MetricsFactoryInstance
): Promise<void> => {
	await addressRegistry.setRegistry(
		'MetricsFactory',
		metricsFactoryProxyInstances.address
	)
	console.log(
		`set Metrics Factory proxy to registory:${metricsFactoryProxyInstances.address}`
	)
}
