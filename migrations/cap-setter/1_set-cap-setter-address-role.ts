const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const registryProxy = ''
	const capSetter = ''
	/// ////////////////////////////////////////////////////////////////

	const addressRegistryInstance = await artifacts
		.require('AddressRegistry')
		.at(registryProxy)
	console.log(`registry proxy address:${addressRegistryInstance.address}`)
	const capSetterAddressBefore = await addressRegistryInstance.registries(
		'CapSetter'
	)
	console.log(`cap setter address:${capSetterAddressBefore}`)
	await addressRegistryInstance.setRegistry('CapSetter', capSetter)
	const capSetterAddress = await addressRegistryInstance.registries('CapSetter')
	console.log(`cap setter address:${capSetterAddress}`)
} as Truffle.Migration

export = handler
