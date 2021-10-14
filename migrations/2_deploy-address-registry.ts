/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const logic = artifacts.require('AddressRegistry')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logix address:${logicInstance.address}`)

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
} as Truffle.Migration

export = handler
