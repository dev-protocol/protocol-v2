const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Address Registry
	const addressRegistory = await deployProxy(artifacts.require('AddressRegistry'), [], { deployer, kind: 'uups' });

	// Dev Arbitrum
	const devArbitrum = await deployProxy(artifacts.require('DevArbitrum'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Dev', devArbitrum.address)

	// Dev Bridge
	const devBridge = await deployProxy(artifacts.require('DevBridge'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('DevBridge', devBridge.address)

	// Lockup
	const lockup = await deployProxy(artifacts.require('Lockup'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Lockup', lockup.address)

	// MarketFactory
	const marketFactory = await deployProxy(artifacts.require('MarketFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('MarketFactory', marketFactory.address)

	// MarketFactory
	const metricsFactory = await deployProxy(artifacts.require('MetricsFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('MetricsFactory', metricsFactory.address)

	// PolicyFactory
	const policyFactory = await deployProxy(artifacts.require('PolicyFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('PolicyFactory', policyFactory.address)

	// PolicyFactory
	const propertyFactory = await deployProxy(artifacts.require('PropertyFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('PropertyFactory', propertyFactory.address)

	// STokensManager
	const sTokensManager = await deployProxy(artifacts.require('STokensManager'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('STokensManager', sTokensManager.address)

	// Withdraw
	const withdraw = await deployProxy(artifacts.require('Withdraw'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Withdraw', withdraw.address)
};
