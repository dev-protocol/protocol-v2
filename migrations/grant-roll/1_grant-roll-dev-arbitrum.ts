/* eslint-disable new-cap */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const devArbitrumInstance = await artifacts
		.require('DevArbitrum')
		.at('0xc28BBE3B5ec1b06FDe258864f12c1577DaDFadDC')
	console.log(`dev arbitrum address:${devArbitrumInstance.address}`)

	const minterRole = await devArbitrumInstance.MINTER_ROLE()
	const bunerRole = await devArbitrumInstance.BURNER_ROLE()
	console.log(`minter role:${minterRole}`)
	console.log(`buner role:${bunerRole}`)
	const devBridgeAddress = '0xCBffAD9738B627Fb9eE3fef691518AAdB98Bc86f'

	await devArbitrumInstance.grantRole(bunerRole, devBridgeAddress)
	await devArbitrumInstance.grantRole(minterRole, devBridgeAddress)

	const hasBurnerRoll = await devArbitrumInstance.hasRole(
		bunerRole,
		devBridgeAddress,
	)
	console.log(`burner roll:${hasBurnerRoll}`)
	const hasMinterRoll = await devArbitrumInstance.hasRole(
		minterRole,
		devBridgeAddress,
	)
	console.log(`minter roll:${hasMinterRoll}`)
} as Truffle.Migration

export = handler
