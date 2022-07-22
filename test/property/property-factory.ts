import { DevProtocolInstance } from '../test-lib/instance'
import { getPropertyAddress, getMarketAddress } from '../test-lib/utils/log'
import { toBigNumber } from '../test-lib/utils/common'
import { getEventValue } from '../test-lib/utils/event'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'
import { validateErrorMessage } from '../test-lib/utils/error'

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
			await dev.generateProperty()
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

	describe('PropertyFactory; getPropertiesOfAuthor', () => {
		const dev = new DevProtocolInstance(deployer)
		let snapshot: Snapshot
		let snapshotId: string
		before(async () => {
			await dev.generateAddressRegistry()
			await Promise.all([
				dev.generatePolicyFactory(),
				dev.generatePropertyFactory(),
			])
			await dev.generatePolicy('PolicyTest1')
			await dev.generateTreasury()
		})

		beforeEach(async () => {
			snapshot = (await takeSnapshot()) as Snapshot
			snapshotId = snapshot.result
		})

		afterEach(async () => {
			await revertToSnapshot(snapshotId)
		})
		it('The property has not been created.', async () => {
			const result = await dev.propertyFactory.getPropertiesOfAuthor(deployer)
			expect(result.length).to.be.equal(0)
		})
		it('You can get a list of the properties you have created.', async () => {
			const propertyAddress = await dev.propertyFactory
				.create('test', 'TEST', deployer)
				.then(getPropertyAddress)
			const result = await dev.propertyFactory.getPropertiesOfAuthor(deployer)
			expect(result.length).to.be.equal(1)
			expect(result[0]).to.be.equal(propertyAddress)
		})
		it('You can get a list of the properties you have created(multiple)', async () => {
			const propertyAddress = await dev.propertyFactory
				.create('test', 'TEST', deployer)
				.then(getPropertyAddress)
			const propertyAddress2 = await dev.propertyFactory
				.create('test2', 'TEST2', deployer)
				.then(getPropertyAddress)
			const result = await dev.propertyFactory.getPropertiesOfAuthor(deployer)
			expect(result.length).to.be.equal(2)
			expect(result[0]).to.be.equal(propertyAddress)
			expect(result[1]).to.be.equal(propertyAddress2)
		})
		it('You can get a list of the properties you have created(other user)', async () => {
			const propertyAddress = await dev.propertyFactory
				.create('test', 'TEST', deployer)
				.then(getPropertyAddress)
			const propertyAddress2 = await dev.propertyFactory
				.create('test2', 'TEST2', user)
				.then(getPropertyAddress)
			const result = await dev.propertyFactory.getPropertiesOfAuthor(deployer)
			expect(result.length).to.be.equal(1)
			expect(result[0]).to.be.equal(propertyAddress)
			const result2 = await dev.propertyFactory.getPropertiesOfAuthor(user)
			expect(result2.length).to.be.equal(1)
			expect(result2[0]).to.be.equal(propertyAddress2)
		})
	})

	describe('PropertyFactory; setPropertyAddress', () => {
		const dev = new DevProtocolInstance(deployer)
		let snapshot: Snapshot
		let snapshotId: string
		before(async () => {
			await dev.generateAddressRegistry()
			await Promise.all([
				dev.generatePolicyFactory(),
				dev.generatePropertyFactory(),
			])
			await dev.generatePolicy('PolicyTest1')
			await dev.generateTreasury()
		})

		beforeEach(async () => {
			snapshot = (await takeSnapshot()) as Snapshot
			snapshotId = snapshot.result
		})

		afterEach(async () => {
			await revertToSnapshot(snapshotId)
		})
		it('already set.', async () => {
			const propertyAddress = await dev.propertyFactory
				.create('test', 'TEST', deployer)
				.then(getPropertyAddress)
			const result = await dev.propertyFactory
				.setPropertyAddress(propertyAddress)
				.catch((err: Error) => err)
			validateErrorMessage(result, 'already set')
		})
		it('not property.', async () => {
			const result = await dev.propertyFactory
				.setPropertyAddress(user)
				.catch((err: Error) => err)
			validateErrorMessage(result, 'not property')
		})
	})
})
