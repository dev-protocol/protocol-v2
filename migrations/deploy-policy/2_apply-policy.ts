const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const policyFactoryAddress = '0x485085f157dD7Ba451f0AB6Fa2ca42421CBA1d3c'
	const policyAddress = '0xf20f18502dDb81ff4265D4E7B09a754a1BbC4782'
	/// ////////////////////////////////////////////////////////////////

	const policyFactoryInstance = await artifacts
		.require('PolicyFactory')
		.at(policyFactoryAddress)
	console.log(`registry address:${policyFactoryInstance.address}`)

	await policyFactoryInstance.create(policyAddress)
} as Truffle.Migration

export = handler
