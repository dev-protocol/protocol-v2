const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const marketFactory = process.env.MARKET_FACTORY!
	const marketBehavior = process.env.MARKET_BEHAVIOR!

	console.log(`market factory address:${marketFactory}`)
	console.log(`market behavior address:${marketBehavior}`)

	const marketFactoryInstance = await artifacts
		.require('MarketFactory')
		.at(marketFactory)
	console.log(`market factory address:${marketFactoryInstance.address}`)

	await marketFactoryInstance.create(marketBehavior)
} as Truffle.Migration

export = handler
