import {
	AddressRegistryInstance,
	MarketFactoryInstance,
} from '../../../types/truffle-contracts'

export const generateMarketFactoryInstances =
	async (): Promise<MarketFactoryInstance> => {
		const marketFactory = await artifacts.require('MarketFactory').new()
		console.log(`new Market Factory Logic:${marketFactory.address}`)
		const admin = await artifacts.require('Admin').new()
		console.log(`new Market Factory Admin:${admin.address}`)
		const tmp = web3.utils.hexToBytes('0x')
		const proxy = await artifacts
			.require('Proxy')
			.new(marketFactory.address, admin.address, tmp)
		console.log(`new Market Factory proxy:${proxy.address}`)
		const marketFactoryContract = artifacts.require('MarketFactory')
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const marketFactoryProxy = await marketFactoryContract.at(proxy.address)
		return marketFactoryProxy
	}

export const setMarketFactoryAddressToRegistry = async (
	addressRegistry: AddressRegistryInstance,
	marketFactoryProxyInstances: MarketFactoryInstance
): Promise<void> => {
	await addressRegistry.setRegistry(
		'MarketFactory',
		marketFactoryProxyInstances.address
	)
	console.log(
		`set Market Factory proxy to registory:${marketFactoryProxyInstances.address}`
	)
}
