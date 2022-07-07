const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const adminAddress = process.env.ADMIN!
	const proxyAddress = process.env.LOCKUP_PROXY!
	console.log(`admin address:${adminAddress}`)
	console.log(`lockup proxy address:${proxyAddress}`)

	const logic = artifacts.require('Lockup')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts.require('DevAdmin').at(adminAddress)
	await adminInstance.upgrade(proxyAddress, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(proxyAddress)

	console.log(`impl address:${implAddress}`)
} as Truffle.Migration

export = handler
