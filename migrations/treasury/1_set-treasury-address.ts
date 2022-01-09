const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const registryProxy = process.env.ADDRESS_REGISTRY!
	const treasury = process.env.TREASURY!

	console.log(`registry proxy address:${registryProxy}`)
	console.log(`treasury address:${treasury}`)

	const addressRegistryInstance = await artifacts
		.require('AddressRegistry')
		.at(registryProxy)
	console.log(`registry proxy address:${addressRegistryInstance.address}`)
	const treasuryAddressBefore = await addressRegistryInstance.registries(
		'Treasury'
	)
	console.log(`treasury address:${treasuryAddressBefore}`)
	await addressRegistryInstance.setRegistry('Treasury', treasury)
	const treasuryAddress = await addressRegistryInstance.registries('Treasury')
	console.log(`treasury address:${treasuryAddress}`)
} as Truffle.Migration

export = handler
