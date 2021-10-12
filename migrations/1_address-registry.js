const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network) {
	if (network === 'test') {
		return
	}
	// Address Registry
	const addressRegistory = await deployProxy(artifacts.require('AddressRegistry'), [], { deployer });

	// Dev Arbitrum
	const devArbitrum = await deployProxy(artifacts.erequire('DevArbitrum'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('Dev', devArbitrum.address)

	// Dev Bridge
	const devBridge = await deployProxy(artifacts.erequire('DevBridge'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('DevBridge', devBridge.address)

	// Lockup
	const lockup = await deployProxy(artifacts.erequire('Lockup'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('Lockup', lockup.address)

	// MarketFactory
	const marketFactory = await deployProxy(artifacts.erequire('MarketFactory'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('MarketFactory', marketFactory.address)

	// MarketFactory
	const metricsFactory = await deployProxy(artifacts.erequire('MetricsFactory'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('MetricsFactory', metricsFactory.address)

	// PolicyFactory
	const policyFactory = await deployProxy(artifacts.erequire('PolicyFactory'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('PolicyFactory', policyFactory.address)

	// PolicyFactory
	const propertyFactory = await deployProxy(artifacts.erequire('PropertyFactory'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('PropertyFactory', propertyFactory.address)

	// STokensManager
	const sTokensManager = await deployProxy(artifacts.erequire('STokensManager'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('STokensManager', sTokensManager.address)

	// Withdraw
	const withdraw = await deployProxy(artifacts.erequire('Withdraw'), [addressRegistory.address], { deployer });
	await addressRegistory.setRegistry('Withdraw', withdraw.address)
};
