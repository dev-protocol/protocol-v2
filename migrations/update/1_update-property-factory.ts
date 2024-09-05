import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const PropertyFactory = artifacts.require('PropertyFactory')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.PROPERTY_FACTORY_PROXY!
	const existing = await PropertyFactory.deployed().catch(() =>
		PropertyFactory.at(proxyAddress),
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(
		existing.address,
		PropertyFactory as unknown as ContractClass,
	)

	console.log('New implementation is valid')

	await upgradeProxy(
		existing.address,
		PropertyFactory as unknown as ContractClass,
	)
} as Truffle.Migration

export = handler
