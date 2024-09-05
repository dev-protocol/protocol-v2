/* eslint-disable new-cap */
const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	// Logic deploy
	const logic = artifacts.require('DevPolygon')
	await deployer.deploy(logic)
	const logicInstance = await logic.deployed()
	console.log(`logic address:${logicInstance.address}`)

	// Load admin
	const admin = artifacts.require('DevAdmin')
	const adminInstance = await admin.deployed()
	console.log(`admin address:${adminInstance.address}`)

	// Proxy deploy
	const devProxy = artifacts.require('DevProxy')
	await deployer.deploy(
		devProxy,
		logicInstance.address,
		adminInstance.address,
		web3.utils.fromUtf8(''),
	)
	const proxyInstance = await devProxy.deployed()
	console.log(`proxy address:${proxyInstance.address}`)

	// Load address registry
	const regInstance = await artifacts
		.require('AddressRegistry')
		.at(process.env.ADDRESS_REGISTRY!)
	console.log(`registry address:${regInstance.address}`)

	// Set address to address registry
	await regInstance.setRegistry('Dev', proxyInstance.address)
	console.log('set proxy address to registry')

	// Initialize
	const wrap = await logic.at(proxyInstance.address)
	await wrap.initialize(regInstance.address)
	console.log(`finished to initialize`)

	// Testnet 0xb5505a6d998549090530911180f38aC5130101c6
	// https://github.com/maticnetwork/static/blob/master/network/testnet/mumbai/index.json
	//
	// mainnet 0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa
	// https://github.com/maticnetwork/static/blob/master/network/mainnet/v1/index.json
	const childChainManagerProxyAddress = process.env.CHILD_CHAIN_MANAGER_PROXY!
	console.log(
		`child chain manager proxy address:${childChainManagerProxyAddress}`,
	)

	// Grant depositer role to childChainManagerproxy
	const depositerRole = await wrap.DEPOSITOR_ROLE()
	console.log(`depositer role:${depositerRole}`)
	await wrap.grantRole(depositerRole, childChainManagerProxyAddress)
} as Truffle.Migration

export = handler
