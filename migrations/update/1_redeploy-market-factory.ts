const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const marketAddress1 = '0x84b9e407e2Ee76A641b45d007bBFd9e60a13FF7d'
	// Const marketAddress2 = ''
	const adminAddress = '0xa3de020256816b3E2C18Fdc3e849Eed4c5e93C62'
	const addressRegistry = '0xbeF4DeEA3AE863739Bd402E025c749536f491ffa'
	/// ////////////////////////////////////////////////////////////////

	const logic = artifacts.require('MarketFactory')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts.require('DevAdmin').at(adminAddress)
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
		.at(addressRegistry)
	console.log(`registry address:${regInstance.address}`)

	await regInstance.setRegistry('MarketFactory', proxyInstance.address)
	console.log('set proxy address to registry')

	const setAddress = await regInstance.registries('MarketFactory')
	console.log(`set proxy address is ${setAddress}`)

	const wrap = await logic.at(proxyInstance.address)
	await wrap.initialize(regInstance.address)

	await wrap.__addMarketAddress(marketAddress1)
	// Await wrap.__addMarketAddress(marketAddress2)
	const addresses = await wrap.getEnabledMarkets()
	console.log(addresses)
} as Truffle.Migration

export = handler
