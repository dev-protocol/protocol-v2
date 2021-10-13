const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Address Registry
	const addressRegistory = await deployProxy(artifacts.require('AddressRegistry'), [], { deployer, kind: 'uups' });

	// Dev Arbitrum
	const devArbitrum = await deployProxy(artifacts.require('DevArbitrum'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Dev', devArbitrum.address);

	// Dev Bridge
	const devBridge = await deployProxy(artifacts.require('DevBridge'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('DevBridge', devBridge.address);

	// Lockup
	const lockup = await deployProxy(artifacts.require('Lockup'), [addressRegistory.address], { deployer, kind: 'uups' });
	await addressRegistory.setRegistry('Lockup', lockup.address);
};
