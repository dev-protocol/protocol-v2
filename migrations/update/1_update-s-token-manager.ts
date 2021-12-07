const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const adminAddress = ''
	const proxyAddress = ''
	/// ////////////////////////////////////////////////////////////////

	const logic = artifacts.require('STokensManager')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts.require('DevAdmin').at(adminAddress)
	console.log(`admin address:${adminInstance.address}`)

	console.log(`proxy address:${proxyAddress}`)

	await adminInstance.upgrade(proxyAddress, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(proxyAddress)

	console.log(`impl address:${implAddress}`)
} as Truffle.Migration

export = handler
