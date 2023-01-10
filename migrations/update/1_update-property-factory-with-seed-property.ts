const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const a_admin = process.env.ADMIN!
	const a_propertyFactoryProxy = process.env.PROPERTY_FACTORY_PROXY!
	const a_registryProxy = process.env.ADDRESS_REGISTRY_PROXY!
	console.log(`Admin: ${a_admin}`)
	console.log(`PropertyFactory proxy: ${a_propertyFactoryProxy}`)
	console.log(`Registry proxy: ${a_registryProxy}`)

	const c_new_property = artifacts.require('Property')
	await deployer.deploy(c_new_property)
	const i_new_property = await c_new_property.deployed()
	console.log(`[CONFIRMED] new seed Property: ${i_new_property.address}`)

	const registry = await artifacts
		.require('AddressRegistry')
		.at(a_registryProxy)

	await registry.setRegistry('Property', i_new_property.address)
	console.log('[CONFIRMED] set the seed Property to Registry')

	const c_new_propertyFactory = artifacts.require('PropertyFactory')
	await deployer.deploy(c_new_propertyFactory)
	const i_new_propertyFactory = await c_new_propertyFactory.deployed()
	console.log(
		`[CONFIRMED] new PropertyFactory implementation: ${i_new_propertyFactory.address}`
	)

	const i_admin = await artifacts.require('DevAdmin').at(a_admin)
	await i_admin.upgrade(a_propertyFactoryProxy, i_new_propertyFactory.address)
	console.log(
		`[CONFIRMED] set the new PropertyFactory implementation to its proxy`
	)

	console.log(
		`impl address: ${await i_admin.getProxyImplementation(
			a_propertyFactoryProxy
		)}`
	)
} as Truffle.Migration

export = handler
