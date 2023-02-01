import { upgradeProxy, validateUpgrade } from '@openzeppelin/truffle-upgrades'
import { type ContractClass } from '@openzeppelin/truffle-upgrades/dist/utils'

const PropertyFactory = artifacts.require('PropertyFactory')
const AddressRegistry = artifacts.require('AddressRegistry')

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const proxyAddress = process.env.PROPERTY_FACTORY_PROXY!
	const proxyAddressAddressRegistry = process.env.ADDRESS_REGISTRY_PROXY!

	const newProperty = artifacts.require('Property')
	_.deploy(newProperty)
	const deployedNewProperty = await newProperty.deployed()
	console.log(`[CONFIRMED] new seed Property: ${deployedNewProperty.address}`)

	const existingAddressRegistry = await AddressRegistry.deployed().catch(() =>
		AddressRegistry.at(proxyAddressAddressRegistry)
	)

	await existingAddressRegistry.setRegistry(
		'Property',
		deployedNewProperty.address
	)
	console.log('[CONFIRMED] set the seed Property to Registry')

	const existing = await PropertyFactory.deployed().catch(() =>
		PropertyFactory.at(proxyAddress)
	)

	console.log('proxy:', existing.address)

	await validateUpgrade(
		existing.address,
		PropertyFactory as unknown as ContractClass
	)

	console.log('New implementation is valid')

	await upgradeProxy(
		existing.address,
		PropertyFactory as unknown as ContractClass
	)
} as Truffle.Migration

export = handler
