
/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const regProxyAddress = '0x519d5e729fbE6B3e4607260413Fb684759612465'
	/// ////////////////////////////////////////////////////////////////

	const policy = artifacts.require('Policy1')
	await deployer.deploy(policy, regProxyAddress)
	const instance = await policy.deployed()
	console.log(`policy address:${instance.address}`)

} as Truffle.Migration

export = handler
