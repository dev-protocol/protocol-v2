/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const admin = artifacts.require('DevAdmin')
	await deployer.deploy(admin)
	const instance = await admin.deployed()
	console.log(`admin address:${instance.address}`)
} as Truffle.Migration

export = handler
