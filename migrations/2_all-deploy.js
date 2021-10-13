const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Address Registry
	const reg = artifacts.require('AddressRegistry');
	const addressRegistory = await reg.deployed();

	// MarketFactory
	const marketFactory = await deployProxy(artifacts.require('MarketFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('MarketFactory', marketFactory.address);

	// MarketFactory
	const metricsFactory = await deployProxy(artifacts.require('MetricsFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('MetricsFactory', metricsFactory.address);

	// PolicyFactory
	const policyFactory = await deployProxy(artifacts.require('PolicyFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('PolicyFactory', policyFactory.address);
};
