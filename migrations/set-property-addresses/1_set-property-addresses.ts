const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const propertyFactoryProxyAddress = process.env.PROPERTY_FACTORY_PROXY!
	console.log(`property factory proxy address:${propertyFactoryProxyAddress}`)

	const propertyFactoryInstance = await artifacts
		.require('PropertyFactory')
		.at(propertyFactoryProxyAddress)

	// Arbitrum rinkeby
	await propertyFactoryInstance.setPropertyAddress(
		'0x15693630ca0f0046cD245864e15E3c425Ee66c9A'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0x054fBdF16AdD75F23f053567Ab767A29B822eC15'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0xb1f8a80b728b797d679e21ac6671975f7b81b16b'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0xd909aeaca072a2e8676f7d4a24c0e888c4753b93'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0xe651716a439666daed1356ef088acec85d257287'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0x466fd7d4dbeb049ee42b0dddcb69d517125e3c94'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0x6175a228f609cfe27957befb9278e19434c12c69'
	)
	await propertyFactoryInstance.setPropertyAddress(
		'0x3a0e2d68bb08a5f8b35a751e7829be89623246a6'
	)
} as Truffle.Migration

export = handler
