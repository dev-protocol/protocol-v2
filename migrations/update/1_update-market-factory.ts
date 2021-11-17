const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Check it!!!//////////////////////////////////////////////////////
	const marketAddress1 = ''
	const marketAddress2 = ''
	const adminAddress = ''
	const marketFactoryProxy = ''
	/// ////////////////////////////////////////////////////////////////

	const logic = artifacts.require('MarketFactory')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	const adminInstance = await artifacts.require('DevAdmin').at(adminAddress)
	console.log(`admin address:${adminInstance.address}`)

	await adminInstance.upgrade(marketFactoryProxy, logicInstance.address)

	const implAddress = await adminInstance.getProxyImplementation(
		marketFactoryProxy
	)

	console.log(`impl address:${implAddress}`)
	const marketFactoryInstance = await artifacts
		.require('MarketFactory')
		.at(marketFactoryProxy)
	await marketFactoryInstance.__addMarketAddress(marketAddress1)
	await marketFactoryInstance.__addMarketAddress(marketAddress2)
	const addresses = await marketFactoryInstance.getEnabledMarkets()
	console.log(addresses)
} as Truffle.Migration

export = handler
