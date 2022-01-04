const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const regProxyAddress = process.env.ADDRESS_REGISTRY!
	const mintPerSecondAndAsset = process.env.MINT_PER_SECOUND_AND_ASSETS!
	const presumptiveAssets = process.env.PRESUMPTIVE_ASSETS!

	console.log(`regProxyAddress address:${regProxyAddress}`)
	console.log(`mintPerSecondAndAsset address:${mintPerSecondAndAsset}`)
	console.log(`presumptiveAssets address:${presumptiveAssets}`)

	const policy = artifacts.require('Policy1')
	await deployer.deploy(
		policy,
		regProxyAddress,
		mintPerSecondAndAsset,
		presumptiveAssets
	)
	const instance = await policy.deployed()
	console.log(`policy address:${instance.address}`)
} as Truffle.Migration

export = handler
