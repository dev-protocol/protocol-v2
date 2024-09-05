import { DevProtocolInstance } from '../test-lib/instance'
import type { PropertyInstance } from '../../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import { getPropertyAddress } from '../test-lib/utils/log'

export const deployerBalance = new BigNumber(1e18).times(10000000)

export const err = (error: Error): Error => error

export const init = async (
	deployer: string,
	user: string,
): Promise<[DevProtocolInstance, PropertyInstance]> => {
	const dev = new DevProtocolInstance(deployer)
	await dev.generateAddressRegistry()
	await dev.generateDev()
	await dev.generateDevBridge()
	await dev.generateSTokensManager()
	await Promise.all([
		dev.generateMarketFactory(),
		dev.generateMetricsFactory(),
		dev.generateLockup(),
		dev.generateWithdraw(),
		dev.generatePropertyFactory(),
		dev.generatePolicyFactory(),
	])
	await dev.dev.mint(deployer, deployerBalance)
	await dev.generatePolicy('PolicyTestBase')
	await dev.generateTreasury()
	await dev.setCapSetter()
	await dev.updateCap()
	const propertyAddress = getPropertyAddress(
		await dev.propertyFactory.create('test', 'TEST', user, {
			from: user,
		}),
	)
	const [property] = await Promise.all([
		artifacts.require('Property').at(propertyAddress),
	])

	await dev.metricsFactory.__addMetrics(
		(await dev.createMetrics(deployer, property.address)).address,
	)

	await dev.lockup.update()

	return [dev, property]
}

export const init2 = async (
	deployer: string,
	user: string,
): Promise<[DevProtocolInstance, PropertyInstance, number]> => {
	const [dev, property] = await init(deployer, user)
	await dev.dev.approve(dev.lockup.address, 600)
	await dev.lockup.depositToProperty(property.address, 100)
	const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)

	return [dev, property, tokenIds[0].toNumber()]
}
