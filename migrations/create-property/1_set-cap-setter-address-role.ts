const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const registryProxy = '0x519d5e729fbE6B3e4607260413Fb684759612465'
	/// ////////////////////////////////////////////////////////////////

	const addressRegistryInstance = await artifacts
		.require('AddressRegistry')
		.at(registryProxy)
	console.log(`registry proxy address:${addressRegistryInstance.address}`)
	const propertyFactoryAddress =
		await addressRegistryInstance.registries('PropertyFactory')
	const propertyFactoryInstance = await artifacts
		.require('PropertyFactory')
		.at(propertyFactoryAddress)
	console.log(`property factory address:${propertyFactoryAddress}`)

	await propertyFactoryInstance.create(
		'test',
		'TEST',
		'0xDaEca4F52C4bE0d6e7DE675C2FEB4C3006A96C84',
	)
	console.log('finish')
} as Truffle.Migration

export = handler
