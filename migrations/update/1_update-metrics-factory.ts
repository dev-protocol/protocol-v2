import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const MetricsFactory = artifacts.require('MetricsFactory')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.METRICS_FACTORY_PROXY!
	const existing = await MetricsFactory.deployed().catch(() =>
		MetricsFactory.at(proxyAddress),
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(
		existing.address,
		MetricsFactory as unknown as ContractClass,
	)

	console.log('New implementation is valid')

	await upgradeProxy(
		existing.address,
		MetricsFactory as unknown as ContractClass,
	)
} as Truffle.Migration

export = handler
