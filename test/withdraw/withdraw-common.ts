import { DevProtocolInstance } from '../test-lib/instance'
import {
	MetricsInstance,
	PropertyInstance,
	IPolicyInstance,
	MarketInstance,
} from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import { getPropertyAddress, getMarketAddress } from '../test-lib/utils/log'
import { getEventValue } from '../test-lib/utils/event'

export const init = async (
	deployer: string,
	user: string
): Promise<
	[
		DevProtocolInstance,
		MetricsInstance,
		PropertyInstance,
		IPolicyInstance,
		MarketInstance
	]
> => {
	const dev = new DevProtocolInstance(deployer)
	await dev.generateAddressRegistry()
	await dev.generateDev()
	await dev.generateDevBridge()
	await dev.generateSTokensManager()

	await dev.generateMarketFactory()
	await dev.generateMetricsFactory()
	await dev.generateLockup()
	await dev.generatePropertyFactory()
	await dev.generatePolicyFactory()

	await dev.generateWithdraw()

	await dev.dev.mint(deployer, new BigNumber(1e18).times(10000000))
	await dev.dev.mint(user, new BigNumber(1e18).times(10000000))

	const policyAddress = await dev.generatePolicy('PolicyTestForWithdraw')
	await dev.generateTreasury()
	await dev.setCapSetter()
	await dev.updateCap()

	const policy = await artifacts
		.require('PolicyTestForWithdraw')
		.at(policyAddress)
	const propertyAddress = getPropertyAddress(
		await dev.propertyFactory.create('test', 'TEST', deployer)
	)
	const property = await artifacts.require('Property').at(propertyAddress)

	await dev.metricsFactory.__setMetricsCountPerProperty(property.address, 1)
	const marketBehavior = await dev.getMarket('MarketTest1', deployer)
	const marketAddress = getMarketAddress(
		await dev.marketFactory.create(marketBehavior.address)
	)
	const market = await artifacts.require('Market').at(marketAddress)

	market.authenticate(property.address, ['id1']).catch(console.error)
	const metricsAddress = await (async () =>
		getEventValue(dev.metricsFactory)('Create', '_metrics'))()
	const metrics = await artifacts
		.require('Metrics')
		.at(metricsAddress as string)

	await dev.lockup.update()

	return [dev, metrics, property, policy, market]
}
