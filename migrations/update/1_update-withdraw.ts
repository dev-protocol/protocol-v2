import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const Withdraw = artifacts.require('Withdraw')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.WITHDRAW_PROXY!
	const existing = await Withdraw.deployed().catch(() =>
		Withdraw.at(proxyAddress)
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(existing.address, Withdraw as unknown as ContractClass)

	console.log('New implementation is valid')

	await upgradeProxy(existing.address, Withdraw as unknown as ContractClass)
} as Truffle.Migration

export = handler
