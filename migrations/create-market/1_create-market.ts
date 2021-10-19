/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const handler = async function (deployer, network) {
	if (network === 'test') {
		return
	}

	const marketFactoryInstance = await artifacts
		.require('MarketFactory')
		.at('0x84b6712Ec4174536daBf019fa6549A2e2125DEae')
	console.log(`market factory address:${marketFactoryInstance.address}`)

	await marketFactoryInstance.create('0x377B7d9C2DA6eD293EA62d2bCdA1cF54009751F8')
} as Truffle.Migration

export = handler
