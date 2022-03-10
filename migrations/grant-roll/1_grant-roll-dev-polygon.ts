/* eslint-disable new-cap */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const devPolygonInstance = await artifacts
		.require('DevPolygon')
		.at(process.env.DEV_POLYGON!)
	console.log(`dev polygon address:${devPolygonInstance.address}`)

	const minterRole = await devPolygonInstance.MINTER_ROLE()
	const bunerRole = await devPolygonInstance.BURNER_ROLE()
	console.log(`minter role:${minterRole}`)
	console.log(`buner role:${bunerRole}`)
	const devBridgeAddress = process.env.DEV_BRIDGE!
	console.log(`dev bridge address:${devBridgeAddress}`)

	await devPolygonInstance.grantRole(bunerRole, devBridgeAddress)
	await devPolygonInstance.grantRole(minterRole, devBridgeAddress)

	const hasBurnerRoll = await devPolygonInstance.hasRole(
		bunerRole,
		devBridgeAddress
	)
	console.log(`burner roll:${hasBurnerRoll}`)
	const hasMinterRoll = await devPolygonInstance.hasRole(
		minterRole,
		devBridgeAddress
	)
	console.log(`minter roll:${hasMinterRoll}`)
} as Truffle.Migration

export = handler
