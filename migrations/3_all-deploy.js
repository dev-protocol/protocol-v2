const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Address Registry
	const reg = artifacts.require('AddressRegistry');
	const addressRegistory = await reg.deployed();

	// PolicyFactory
	const propertyFactory = await deployProxy(artifacts.require('PropertyFactory'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('PropertyFactory', propertyFactory.address);

	// STokensManager
	const sTokensManager = await deployProxy(artifacts.require('STokensManager'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('STokensManager', sTokensManager.address);

	// Withdraw
	const withdraw = await deployProxy(artifacts.require('Withdraw'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Withdraw', withdraw.address);
};
