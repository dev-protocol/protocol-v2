const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const logic = artifacts.require('MetricsFactory')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts
		.require('DevAdmin')
		.at('0x00551f424BD3426A1B15eb1Ea4680cc2bf7E9D76')
	console.log(`admin address:${adminInstance.address}`)

	const metricsFactoryProxy = '0x650663aD898A018cca44Ac224Be2286D14B7421d'

	await adminInstance.upgrade(metricsFactoryProxy, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(
		metricsFactoryProxy
	)

	console.log(`impl address:${implAddress}`)
} as Truffle.Migration

export = handler
