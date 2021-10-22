
/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const marketAddress = ''
	/// ////////////////////////////////////////////////////////////////

	const marketInstance = await artifacts.require('Market').at(marketAddress)
	console.log(`market address:${marketInstance.address}`)
	const properties = await marketInstance.getAuthenticatedProperties()
	console.log(properties)
	const count = await marketInstance.issuedMetrics()
	console.log(count.toString())

} as Truffle.Migration

export = handler
