import { DevProtocolInstance } from '../test-lib/instance'
import { getPropertyAddress, getMarketAddress } from '../test-lib/utils/log'
import { toBigNumber } from '../test-lib/utils/common'
import { getEventValue } from '../test-lib/utils/event'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'

contract('PropertyFactoryTest', ([deployer, user, user2, marketFactory]) => {
	describe('PropertyFactory; create', () => {
		const init = async (): Promise<[DevProtocolInstance, string]> => {
			const dev = new DevProtocolInstance(deployer)
			await dev.generateAddressRegistry()
			await dev.generateDev()
			await dev.generateDevBridge()
			await dev.generateSTokensManager()
			await Promise.all([
				dev.generateMetricsFactory(),
				dev.generatePropertyFactory(),
				dev.generatePolicyFactory(),
				dev.generateLockup(),
			])
			await dev.generatePolicy()
			await dev.generateTreasury()
			await dev.setCapSetter()
			await dev.updateCap()
			await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
			const propertyAddress = await dev.propertyFactory
				.create('sample', 'SAMPLE', user, {
					from: user2,
				})
				.then(getPropertyAddress)
			return [dev, propertyAddress]
		}

		let dev: DevProtocolInstance
		let property: string
		let snapshot: Snapshot
		let snapshotId: string

		before(async () => {
			;[dev, property] = await init()
		})

		beforeEach(async () => {
			snapshot = (await takeSnapshot()) as Snapshot
			snapshotId = snapshot.result
		})

		afterEach(async () => {
			await revertToSnapshot(snapshotId)
		})

		it('Create a new property contract and emit Create event', async () => {
			const deployedProperty = await artifacts.require('Property').at(property)
			const name = await deployedProperty.name({ from: user2 })
			const symbol = await deployedProperty.symbol({ from: user2 })
			const decimals = await deployedProperty.decimals({ from: user2 })
			const totalSupply = await deployedProperty
				.totalSupply({ from: user2 })
				.then(toBigNumber)
			const author = await deployedProperty.author({ from: user2 })
			expect(name).to.be.equal('sample')
			expect(symbol).to.be.equal('SAMPLE')
			expect(decimals.toNumber()).to.be.equal(18)
			expect(totalSupply.toFixed()).to.be.equal(
				toBigNumber(1000).times(10000).times(1e18).toFixed()
			)
			expect(author).to.be.equal(user)
		})

		it('Should update to isProperty', async () => {
			const property = await dev.propertyFactory
				.create('sample', 'SAMPLE', user)
				.then(getPropertyAddress)
			const res = await dev.propertyFactory.isProperty(property)
			expect(res).to.be.equal(true)
		})
	})
	describe('PropertyFactory; createAndAuthenticate', () => {
		const dev = new DevProtocolInstance(deployer)
		let marketAddress: string
		before(async () => {
			await dev.generateAddressRegistry()
			await dev.generateDev()
			await dev.generateDevBridge()
			await dev.generateSTokensManager()
			await Promise.all([
				dev.generateMarketFactory(),
				dev.generateMetricsFactory(),
				dev.generatePolicyFactory(),
				dev.generatePropertyFactory(),
				dev.generateLockup(),
				dev.generateWithdraw(),
			])
			await dev.generatePolicy('PolicyTest1')
			await dev.generateTreasury()
			await dev.setCapSetter()
			await dev.updateCap()
			const market = await dev.getMarket('MarketTest1', user)
			marketAddress = await dev.marketFactory
				.create(market.address, {
					from: user,
				})
				.then(getMarketAddress)
			await dev.dev.mint(user, 10000000000)
		})

		it('Create a new Property and authenticate at the same time', async () => {
			dev.propertyFactory
				.createAndAuthenticate('example', 'EXAMPLE', marketAddress, ['test'], {
					from: user,
				})
				.catch(console.error)
			const [propertyCreator, property, market, metrics] = await Promise.all([
				getEventValue(dev.propertyFactory)('Create', '_from'),
				getEventValue(dev.propertyFactory)('Create', '_property'),
				getEventValue(dev.metricsFactory)('Create', '_market'),
				getEventValue(dev.metricsFactory)('Create', '_metrics'),
			])
			const linkedProperty = await Promise.all([
				artifacts.require('Metrics').at(metrics as string),
			]).then(async ([c]) => c.property())
			const propertyAuthor = await Promise.all([
				artifacts.require('Property').at(property as string),
			]).then(async ([c]) => c.author())
			expect(propertyCreator).to.be.equal(user)
			expect(propertyAuthor).to.be.equal(user)
			expect(property).to.be.equal(linkedProperty)
			expect(market).to.be.equal(marketAddress)
		})
	})
})
