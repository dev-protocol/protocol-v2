const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const logic = artifacts.require('Dev')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const admin = artifacts.require('DevAdmin')
	const adminInstance = await admin.deployed()
	console.log(`admin address:${adminInstance.address}`)

	const devProxy = artifacts.require('DevProxy')
	await deployer.deploy(
		devProxy,
		logicInstance.address,
		adminInstance.address,
		web3.utils.fromUtf8('')
	)
	const proxyInstance = await devProxy.deployed()
	console.log(`proxy address:${proxyInstance.address}`)

	const regInstance = await artifacts
		.require('AddressRegistry')
		.at(process.env.ADDRESS_REGISTRY!)
	console.log(`registry address:${regInstance.address}`)

	await regInstance.setRegistry('Dev', proxyInstance.address)
	console.log('set proxy address to registry')

	const wrap = await logic.at(proxyInstance.address)
	await wrap.__Dev_init('Dev')
	console.log(`finished to initialize`)
} as Truffle.Migration

export = handler
