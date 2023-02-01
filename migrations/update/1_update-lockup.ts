import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const Lockup = artifacts.require('Lockup')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.LOCKUP_PROXY!
	const existing = await Lockup.deployed().catch(() => Lockup.at(proxyAddress))

	console.log('proxy:', existing.address)

	await validateUpgrade(existing.address, Lockup as unknown as ContractClass)

	console.log('New implementation is valid')

	await upgradeProxy(existing.address, Lockup as unknown as ContractClass)
} as Truffle.Migration

export = handler
