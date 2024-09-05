import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const DevArbitrum = artifacts.require('DevArbitrum')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.DEV_PROXY!
	const existing = await DevArbitrum.deployed().catch(() =>
		DevArbitrum.at(proxyAddress),
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(
		existing.address,
		DevArbitrum as unknown as ContractClass,
	)

	console.log('New implementation is valid')

	await upgradeProxy(existing.address, DevArbitrum as unknown as ContractClass)
} as Truffle.Migration

export = handler
