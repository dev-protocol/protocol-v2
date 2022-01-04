const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const policyFactoryAddress = process.env.POLICY_FACTORY!
	const policyAddress = process.env.POLICY!
	const addressRegistory = process.env.ADDRESS_REGISTRY!

	console.log(`PolicyFactory address:${policyFactoryAddress}`)
	console.log(`Policy address:${policyAddress}`)
	console.log(`Address Registry address:${addressRegistory}`)

	const policyFactoryInstance = await artifacts
		.require('PolicyFactory')
		.at(policyFactoryAddress)
	console.log(`registry address:${policyFactoryInstance.address}`)

	await policyFactoryInstance.create(policyAddress)

	const addressRegistryInstance = await artifacts
	.require('AddressRegistry')
	.at(addressRegistory)
	const setPolicyAddress = await addressRegistryInstance.registries('Policy')
	console.log(`setPolicy address:${setPolicyAddress}`)

} as Truffle.Migration

export = handler
