const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const marketAddress = ''
	const propertyAddress = ''
	const arg1 = ''
	const arg2 = ''
	/// ////////////////////////////////////////////////////////////////

	const marketInstance = await artifacts.require('Market').at(marketAddress)
	console.log(`market address:${marketInstance.address}`)
	await marketInstance.authenticate(propertyAddress, [arg1, arg2])
} as Truffle.Migration

export = handler
