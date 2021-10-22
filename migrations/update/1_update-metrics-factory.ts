/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const logic = artifacts.require('MarketFactory')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts
		.require('DevAdmin')
		.at('0x00551f424BD3426A1B15eb1Ea4680cc2bf7E9D76')
	console.log(`admin address:${adminInstance.address}`)

	const proxy = '0x84b6712Ec4174536daBf019fa6549A2e2125DEae'

	await adminInstance.upgrade(proxy, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(
		proxy
	)

	console.log(`impl address:${implAddress}`)
} as Truffle.Migration

export = handler
