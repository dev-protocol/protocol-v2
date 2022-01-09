/* eslint-disable new-cap */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const devInstance = await artifacts.require('Dev').at(process.env.DEV!)
	console.log(`dev address:${devInstance.address}`)

	const minterRole = await devInstance.MINTER_ROLE()
	const bunerRole = await devInstance.BURNER_ROLE()
	console.log(`minter role:${minterRole}`)
	console.log(`buner role:${bunerRole}`)
	const devBridgeAddress = process.env.DEV_BRIDGE!
	console.log(`dev bridge address:${devBridgeAddress}`)

	await devInstance.grantRole(bunerRole, devBridgeAddress)
	await devInstance.grantRole(minterRole, devBridgeAddress)

	const hasBurnerRoll = await devInstance.hasRole(bunerRole, devBridgeAddress)
	console.log(`burner roll:${hasBurnerRoll}`)
	const hasMinterRoll = await devInstance.hasRole(minterRole, devBridgeAddress)
	console.log(`minter roll:${hasMinterRoll}`)
} as Truffle.Migration

export = handler
