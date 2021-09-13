import { DevProtocolInstance } from '../test-lib/instance'
import { getPropertyAddress, getMarketAddress } from '../test-lib/utils/log'
import { toBigNumber } from '../test-lib/utils/common'
import { getEventValue } from '../test-lib/utils/event'

contract('PropertyFactoryTest', ([deployer, user, user2, marketFactory]) => {
	describe('PropertyFactory; create', () => {
		const init = async (): Promise<[DevProtocolInstance, string]> => {
			const dev = new DevProtocolInstance(deployer)
			await dev.generateAddressRegistry()
			await dev.generateDev()
			await dev.generateDevMinter()
			await dev.generateSTokensManager()
			await Promise.all([
				dev.generateMetricsFactory(),
				dev.generatePropertyFactory(),
				dev.generatePolicyFactory(),
				dev.generateLockup(),
			])
			await dev.generatePolicy()
			await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
			const propertyAddress = await dev.propertyFactory
				.create('sample', 'SAMPLE', user, {
					from: user2,
				})
				.then(getPropertyAddress)
			return [dev, propertyAddress]
		}

		it('Create a new property contract and emit Create event', async () => {
			const [, property] = await init()
			// eslint-disable-next-line @typescript-eslint/await-thenable
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
			const [dev] = await init()
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
			await dev.generateDevMinter()
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
			const market = await dev.getMarket('MarketTest1', user)
			marketAddress = await dev.marketFactory
				.create(market.address, {
					from: user,
				})
				.then(getMarketAddress)
			await dev.dev.mint(user, 10000000000)
			await (market as any).setAssociatedMarket(marketAddress, {
				from: user,
			})
		})

		it('Create a new Property and authenticate at the same time', async () => {
			void dev.propertyFactory
				.createAndAuthenticate(
					'example',
					'EXAMPLE',
					marketAddress,
					['test'],
					{ from: user }
				)
				.catch(console.error)
			const [propertyCreator, property, market, metrics] = await Promise.all([
				getEventValue(dev.propertyFactory)('Create', '_from'),
				getEventValue(dev.propertyFactory)('Create', '_property'),
				getEventValue(dev.metricsFactory)('Create', '_from'),
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
