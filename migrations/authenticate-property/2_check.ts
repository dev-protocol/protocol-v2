
/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const marketAddress = '0xeb85170bCE4Ea8a9ca0fb5B6620aB74Ef111a50C'
	/// ////////////////////////////////////////////////////////////////

	const marketInstance = await artifacts.require('Market').at(marketAddress)
	console.log(`market address:${marketInstance.address}`)
	const properties = await marketInstance.getAuthenticatedProperties()
	console.log(properties)
	const count = await marketInstance.issuedMetrics()
	console.log(count.toString())

} as Truffle.Migration

export = handler
