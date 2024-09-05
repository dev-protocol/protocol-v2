import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const STokensManager = artifacts.require('STokensManager')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.S_TOKEN_MANAGER_PROXY!
	const existing = await STokensManager.deployed().catch(() =>
		STokensManager.at(proxyAddress),
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(
		existing.address,
		STokensManager as unknown as ContractClass,
	)

	console.log('New implementation is valid')

	await upgradeProxy(
		existing.address,
		STokensManager as unknown as ContractClass,
	)
} as Truffle.Migration

export = handler
