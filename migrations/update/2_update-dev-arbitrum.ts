const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const logic = artifacts.require('DevArbitrum')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts
		.require('DevAdmin')
		.at('0xa3de020256816b3E2C18Fdc3e849Eed4c5e93C62')
	console.log(`admin address:${adminInstance.address}`)

	const proxy = '0x91F5dC90979b058eBA3be6B7B7e523df7e84e137'

	await adminInstance.upgrade(proxy, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(proxy)

	console.log(`impl address:${implAddress}`)
} as Truffle.Migration

export = handler
