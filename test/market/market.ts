import { DevProtocolInstance } from '../test-lib/instance'
import { forwardBlockTimestamp } from '../test-lib/utils/common'
import { MarketInstance } from '../../types/truffle-contracts'
import { getPropertyAddress, getMarketAddress } from '../test-lib/utils/log'
import { watch } from '../test-lib/utils/event'
import {
	validateErrorMessage,
	validateAddressErrorMessage,
} from '../test-lib/utils/error'

contract(
	'MarketTest',
	([deployer, marketFactory, behavuor, user, user1, propertyAuther]) => {
		const marketContract = artifacts.require('Market')
		describe('Market; constructor', () => {
			const dev = new DevProtocolInstance(deployer)
			beforeEach(async () => {
				await dev.generateAddressRegistry()
			})
			it('Cannot be created from other than market factory', async () => {
				await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
				const result = await marketContract
					.new(dev.addressRegistry.address, behavuor, { from: deployer })
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Each property is set.', async () => {
				await Promise.all([dev.generatePolicyFactory()])
				await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
				const iPolicyInstance = await dev.getPolicy('PolicyTest1', user)
				await dev.policyFactory.create(iPolicyInstance.address)
				const market = await marketContract.new(
					dev.addressRegistry.address,
					behavuor,
					{ from: marketFactory }
				)
				expect(await market.behavior()).to.be.equal(behavuor)
				expect(await market.enabled()).to.be.equal(false)
			})
		})
		describe('Market; toEnable', () => {
			const dev = new DevProtocolInstance(deployer)
			let market: MarketInstance
			beforeEach(async () => {
				await dev.generateAddressRegistry()
				await Promise.all([dev.generatePolicyFactory()])
				await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
				const iPolicyInstance = await dev.getPolicy('PolicyTest1', user)
				await dev.policyFactory.create(iPolicyInstance.address)
				market = await marketContract.new(
					dev.addressRegistry.address,
					behavuor,
					{
						from: marketFactory,
					}
				)
			})
			it('Cannot be enabled from other than market factory', async () => {
				const result = await market.toEnable().catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Can be enabled from the market factory', async () => {
				expect(await market.enabled()).to.be.equal(false)
				await market.toEnable({ from: marketFactory })
				expect(await market.enabled()).to.be.equal(true)
			})
			it('Cannot be enabled if deadline is over', async () => {
				expect(await market.enabled()).to.be.equal(false)
				await forwardBlockTimestamp(11)
				const result = await market
					.toEnable({ from: marketFactory })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'deadline is over')
				expect(await market.enabled()).to.be.equal(false)
			})
		})
		describe('Market; schema', () => {
			const dev = new DevProtocolInstance(deployer)
			it('Get Schema of mapped Behavior Contract', async () => {
				await dev.generateAddressRegistry()
				await Promise.all([dev.generatePolicyFactory()])
				await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
				const iPolicyInstance = await dev.getPolicy('PolicyTest1', user)
				await dev.policyFactory.create(iPolicyInstance.address)
				const behavuor = await dev.getMarket('MarketTest1', user)
				const market = await marketContract.new(
					dev.addressRegistry.address,
					behavuor.address,
					{ from: marketFactory }
				)
				expect(await market.schema()).to.be.equal('[]')
			})
		})
		describe('Market; name', () => {
			const dev = new DevProtocolInstance(deployer)
			it('Get name Behavior Contract', async () => {
				await dev.generateAddressRegistry()
				await Promise.all([dev.generatePolicyFactory()])
				await dev.addressRegistry.setRegistry('MarketFactory', marketFactory)
				const iPolicyInstance = await dev.getPolicy('PolicyTest1', user)
				await dev.policyFactory.create(iPolicyInstance.address)
				const behavuor = await dev.getMarket('MarketTest1', user)
				const market = await marketContract.new(
					dev.addressRegistry.address,
					behavuor.address,
					{ from: marketFactory }
				)
				expect(await market.name()).to.be.equal('MarketTest1')
			})
		})
		describe('Market; associatedMarket', () => {
			const dev = new DevProtocolInstance(deployer)
			it('Get associatedMarket Behavior Contract', async () => {
				await dev.generateAddressRegistry()
				await dev.generatePolicyFactory()
				await dev.generateLockup()
				await dev.generateMarketFactory()
				await dev.generateMetricsFactory()
				await dev.generatePolicy('PolicyTest1')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				const behavior = await dev.getMarket('MarketTest3', user)
				const createMarketResult = await dev.marketFactory.create(
					behavior.address
				)
				const marketAddress = getMarketAddress(createMarketResult)
				expect(await behavior.associatedMarket()).to.be.equal(marketAddress)
			})
		})
		describe('Market; authenticate, authenticatedCallback', () => {
			const dev = new DevProtocolInstance(deployer)
			let marketAddress1: string
			let marketAddress2: string
			let propertyAddress: string
			beforeEach(async () => {
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
				const behavior1 = await dev.getMarket('MarketTest3', user)
				const behavior2 = await dev.getMarket('MarketTest3', user)
				await dev.generatePolicy('PolicyTest1')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				let createMarketResult = await dev.marketFactory.create(
					behavior1.address
				)
				marketAddress1 = getMarketAddress(createMarketResult)
				createMarketResult = await dev.marketFactory.create(behavior2.address)
				marketAddress2 = getMarketAddress(createMarketResult)
				const createPropertyResult = await dev.propertyFactory.create(
					'test',
					'TEST',
					propertyAuther
				)
				propertyAddress = getPropertyAddress(createPropertyResult)
				await dev.metricsFactory.__setHasAssets(propertyAddress, true)
				await dev.dev.mint(propertyAuther, 10000000000, { from: deployer })
				await dev.dev.approve(dev.lockup.address, 100000, {
					from: propertyAuther,
				})
			})
			it('Proxy to mapped Behavior Contract.', async () => {
				await dev.lockup.depositToProperty(propertyAddress, 100000, {
					from: propertyAuther,
				})
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch(console.error)
				const metricsAddress = await new Promise<string>((resolve) => {
					watch(dev.metricsFactory)('Create', (_, values) => {
						resolve(values._metrics)
					})
				})
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const metrics = await artifacts.require('Metrics').at(metricsAddress)
				expect(await metrics.market()).to.be.equal(marketAddress1)
				expect(await metrics.property()).to.be.equal(propertyAddress)
				const tmp = await dev.dev.balanceOf(propertyAuther)
				expect(tmp.toNumber()).to.be.equal(9999800000)
				const behavuor = await marketInstance.behavior()
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const behavuorInstance = await artifacts
					.require('MarketTest3')
					.at(behavuor)
				const key = await behavuorInstance.getId(metrics.address)
				expect(key).to.be.equal('id-key')
			})
			it(`The sender's address is passed to Market Behavior.`, async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				await marketInstance.authenticate(propertyAddress, ['id-key'], {
					from: propertyAuther,
				})
				const marketTest3 = artifacts.require('MarketTest3')
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketTest3Instance = await marketTest3.at(
					await marketInstance.behavior()
				)
				expect(
					await marketTest3Instance.currentAuthinticateAccount()
				).to.be.equal(propertyAuther)
			})
			it('Should fail to run when not enabled Market.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress2)
				const result = await marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch((err: Error) => err)
				validateErrorMessage(result, 'market is not enabled')
			})
			it('Should fail to run when sent from other than Property Factory Contract.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				const result = await marketInstance
					.authenticate(propertyAddress, ['id-key'])
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Should fail to run when the passed ID is already authenticated.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				await marketInstance.authenticate(propertyAddress, ['id-key'], {
					from: propertyAuther,
				})
				const result = await marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch((err: Error) => err)
				validateErrorMessage(result, 'id is duplicated')
			})

			it('Should fail to deauthenticate when sent from other than passed metrics linked property author.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch(console.error)
				const metricsAddress = await new Promise<string>((resolve) => {
					watch(dev.metricsFactory)('Create', (_, values) => {
						resolve(values._metrics)
					})
				})
				const result = await marketInstance
					.deauthenticate(metricsAddress, { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'this is illegal address')
			})
			it('When deauthenticate, decrease the issuedMetrics, emit the Destroy event.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch(console.error)
				const metricsAddress = await new Promise<string>((resolve) => {
					watch(dev.metricsFactory)('Create', (_, values) => {
						resolve(values._metrics)
					})
				})
				let count = await marketInstance.issuedMetrics()
				expect(count.toNumber()).to.be.equal(1)
				marketInstance
					.deauthenticate(metricsAddress, {
						from: propertyAuther,
					})
					.catch(console.error)
				const [_market, _metrics] = await new Promise<string[]>((resolve) => {
					watch(dev.metricsFactory)('Destroy', (_, values) => {
						const { _market, _metrics } = values
						resolve([_market, _metrics])
					})
				})
				count = await marketInstance.issuedMetrics()
				expect(count.toNumber()).to.be.equal(0)
				expect(_market).to.be.equal(marketAddress1)
				expect(_metrics).to.be.equal(metricsAddress)
			})
			it('Should fail to deauthenticate when passed already deauthenticated metrics.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				marketInstance
					.authenticate(propertyAddress, ['id-key'], {
						from: propertyAuther,
					})
					.catch(console.error)
				const metricsAddress = await new Promise<string>((resolve) => {
					watch(dev.metricsFactory)('Create', (_, values) => {
						resolve(values._metrics)
					})
				})
				await marketInstance.deauthenticate(metricsAddress, {
					from: propertyAuther,
				})
				const result = await marketInstance
					.deauthenticate(metricsAddress, {
						from: propertyAuther,
					})
					.catch((err: Error) => err)
				validateErrorMessage(result, 'not authenticated')
			})
		})
		describe('Market; authenticateFromPropertyFactory, authenticatedCallback', () => {
			const dev = new DevProtocolInstance(deployer)
			let marketAddress1: string
			let marketAddress2: string
			let propertyAddress: string
			const propertyFactory = user1
			beforeEach(async () => {
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
				const behavior1 = await dev.getMarket('MarketTest3', user)
				const behavior2 = await dev.getMarket('MarketTest3', user)
				await dev.generatePolicy('PolicyTest1')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				let createMarketResult = await dev.marketFactory.create(
					behavior1.address
				)
				marketAddress1 = getMarketAddress(createMarketResult)
				createMarketResult = await dev.marketFactory.create(behavior2.address)
				marketAddress2 = getMarketAddress(createMarketResult)
				const createPropertyResult = await dev.propertyFactory.create(
					'test',
					'TEST',
					propertyAuther
				)
				propertyAddress = getPropertyAddress(createPropertyResult)
				await dev.metricsFactory.__setHasAssets(propertyAddress, true)
				await dev.dev.mint(propertyAuther, 10000000000, { from: deployer })
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				await dev.dev.approve(dev.lockup.address, 100000, {
					from: propertyAuther,
				})
			})
			it('Proxy to mapped Behavior Contract.', async () => {
				await dev.lockup.depositToProperty(propertyAddress, 100000, {
					from: propertyAuther,
				})
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				void marketInstance.authenticateFromPropertyFactory(
					propertyAddress,
					propertyAuther,
					['id-key'],
					{
						from: propertyFactory,
					}
				)
				const metricsAddress = await new Promise<string>((resolve) => {
					watch(dev.metricsFactory)('Create', (_, values) => {
						resolve(values._metrics)
					})
				})
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const metrics = await artifacts.require('Metrics').at(metricsAddress)
				expect(await metrics.market()).to.be.equal(marketAddress1)
				expect(await metrics.property()).to.be.equal(propertyAddress)
				const tmp = await dev.dev.balanceOf(propertyAuther)
				expect(tmp.toNumber()).to.be.equal(9999800000)
				const behavuor = await marketInstance.behavior()
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const behavuorInstance = await artifacts
					.require('MarketTest3')
					.at(behavuor)
				const key = await behavuorInstance.getId(metrics.address)
				expect(key).to.be.equal('id-key')
			})
			it('The passed address is passed to Market Behavior.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				await marketInstance.authenticateFromPropertyFactory(
					propertyAddress,
					propertyAuther,
					['id-key'],
					{ from: propertyFactory }
				)
				const marketTest3 = artifacts.require('MarketTest3')
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketTest3Instance = await marketTest3.at(
					await marketInstance.behavior()
				)
				expect(
					await marketTest3Instance.currentAuthinticateAccount()
				).to.be.equal(propertyAuther)
			})
			it('Should fail to run when not enabled Market.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress2)
				const result = await marketInstance
					.authenticateFromPropertyFactory(
						propertyAddress,
						propertyAuther,
						['id-key'],
						{
							from: propertyFactory,
						}
					)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'market is not enabled')
			})
			it('Should fail to run when sent from other than Property Factory Contract.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				const result = await marketInstance
					.authenticateFromPropertyFactory(propertyAddress, propertyAuther, [
						'id-key',
					])
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Should fail to run when the passed ID is already authenticated.', async () => {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				await marketInstance.authenticate(propertyAddress, ['id-key'], {
					from: propertyAuther,
				})
				const result = await marketInstance
					.authenticateFromPropertyFactory(propertyAddress, user, ['id-key'], {
						from: propertyFactory,
					})
					.catch((err: Error) => err)
				validateErrorMessage(result, 'id is duplicated')
			})
		})
		describe('Market; getAuthenticatedProperties', () => {
			const init = async (): Promise<
				[DevProtocolInstance, MarketInstance, string]
			> => {
				const dev = new DevProtocolInstance(deployer)
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
				const behavior1 = await dev.getMarket('MarketTest1', user)
				await dev.generatePolicy('PolicyTest1')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				const createMarketResult = await dev.marketFactory.create(
					behavior1.address
				)
				const marketAddress1 = getMarketAddress(createMarketResult)
				const createPropertyResult = await dev.propertyFactory.create(
					'test',
					'TEST',
					propertyAuther
				)
				const propertyAddress = getPropertyAddress(createPropertyResult)
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const marketInstance = await marketContract.at(marketAddress1)
				await dev.dev.mint(propertyAuther, 10000000000, { from: deployer })
				return [dev, marketInstance, propertyAddress]
			}

			it('If none of the properties are authenticated, an empty array will be returned.', async () => {
				const [, marketInstance] = await init()
				const properties = await marketInstance.getAuthenticatedProperties()
				expect(properties.length).to.be.equal(0)
			})
			it('An array of authenticated properties will be returned.', async () => {
				const [, marketInstance, propertyAddress] = await init()
				await marketInstance.authenticate(propertyAddress, ['test'], {
					from: propertyAuther,
				})
				const properties = await marketInstance.getAuthenticatedProperties()
				expect(properties.length).to.be.equal(1)
				expect(properties[0]).to.be.equal(propertyAddress)
			})
			it('An array of multiple authenticated properties will be returned.', async () => {
				const [dev, marketInstance, propertyAddress] = await init()
				await marketInstance.authenticate(propertyAddress, ['test'], {
					from: propertyAuther,
				})
				const createPropertyResult = await dev.propertyFactory.create(
					'test2',
					'TEST2',
					propertyAuther
				)
				const propertyAddress2 = getPropertyAddress(createPropertyResult)
				await marketInstance.authenticate(propertyAddress2, ['test2'], {
					from: propertyAuther,
				})
				const properties = await marketInstance.getAuthenticatedProperties()
				expect(properties.length).to.be.equal(2)
				expect(properties[0]).to.be.equal(propertyAddress)
				expect(properties[1]).to.be.equal(propertyAddress2)
			})
			it('If property is deauthenticated', async () => {
				const [, marketInstance, propertyAddress] = await init()
				await marketInstance.authenticate(propertyAddress, ['test'], {
					from: propertyAuther,
				})
				const behaviorAddress = await marketInstance.behavior()
				const marketTest1Contract = artifacts.require('MarketTest1')
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const market1Instance = await marketTest1Contract.at(behaviorAddress)
				const metricsAddress = await market1Instance.getMetrics('test')
				await marketInstance.deauthenticate(metricsAddress, {
					from: propertyAuther,
				})
				const properties = await marketInstance.getAuthenticatedProperties()
				expect(properties.length).to.be.equal(0)
			})
			it('When multiple properties have been deauthenticated', async () => {
				const [dev, marketInstance, propertyAddress] = await init()
				await marketInstance.authenticate(propertyAddress, ['test'], {
					from: propertyAuther,
				})
				const createPropertyResult = await dev.propertyFactory.create(
					'test2',
					'TEST2',
					propertyAuther
				)
				const propertyAddress2 = getPropertyAddress(createPropertyResult)
				await marketInstance.authenticate(propertyAddress2, ['test2'], {
					from: propertyAuther,
				})
				const behaviorAddress = await marketInstance.behavior()
				const marketTest1Contract = artifacts.require('MarketTest1')
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const market1Instance = await marketTest1Contract.at(behaviorAddress)
				const metricsAddress2 = await market1Instance.getMetrics('test2')
				await marketInstance.deauthenticate(metricsAddress2, {
					from: propertyAuther,
				})
				const properties = await marketInstance.getAuthenticatedProperties()
				expect(properties.length).to.be.equal(1)
				expect(properties[0]).to.be.equal(propertyAddress)
				const metricsAddress = await market1Instance.getMetrics('test')
				await marketInstance.deauthenticate(metricsAddress, {
					from: propertyAuther,
				})
				const propertiesNext = await marketInstance.getAuthenticatedProperties()
				expect(propertiesNext.length).to.be.equal(0)
			})
		})
	}
)
