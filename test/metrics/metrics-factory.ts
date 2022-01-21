import { DevProtocolInstance } from '../test-lib/instance'
import { getMetricsAddress } from '../test-lib/utils/log'
import { watch } from '../test-lib/utils/event'
import {
	validateErrorMessage,
	validateAddressErrorMessage,
} from '../test-lib/utils/error'
import {
	takeSnapshot,
	revertToSnapshot,
	Snapshot,
} from '../test-lib/utils/snapshot'

contract(
	'MetricsFactoryTest',
	([deployer, user, market, property1, property2, dummyMetrics]) => {
		const init = async () => {
			const dev = new DevProtocolInstance(deployer)
			await dev.generateAddressRegistry()
			await Promise.all([
				dev.generateMarketFactory(),
				dev.generateMetricsFactory(),
			])
			await dev.marketFactory.__addMarket(market)
			return [dev]
		}

		let dev: DevProtocolInstance
		let snapshot: Snapshot
		let snapshotId: string

		before(async () => {
			;[dev] = await init()
		})

		beforeEach(async () => {
			snapshot = (await takeSnapshot()) as Snapshot
			snapshotId = snapshot.result
		})

		afterEach(async () => {
			await revertToSnapshot(snapshotId)
		})

		describe('MetircsFactory; create', () => {
			it('Adds a new metrics contract address', async () => {
				dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.catch(console.error)
				const [from, property, metrics] = await new Promise<string[]>(
					(resolve) => {
						watch(dev.metricsFactory)('Create', (_, values) => {
							const { _market, _property, _metrics } = values
							resolve([_market, _property, _metrics])
						})
					}
				)
				expect(market).to.be.equal(from)
				expect(property).to.be.equal(property1)
				const result = await dev.metricsFactory.isMetrics(metrics)
				expect(result).to.be.equal(true)
			})
			it('Cannot be executed from other than market contract.', async () => {
				const result = await dev.metricsFactory
					.create(property2, {
						from: user,
					})
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Should to be increased metricsCount always', async () => {
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(0)
				await dev.metricsFactory.create(property1, {
					from: market,
				})
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.create(property2, {
					from: market,
				})
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(2)
			})
			it('Should to be increased metricsOfProperty always', async () => {
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(0)
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(1)

				const m2 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(2)
				expect(await dev.metricsFactory.metricsOfProperty(property1)).to.be.eql(
					[m1, m2]
				)
			})
			it('Should to be increased metricsCountPerProperty always', async () => {
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(0)
				await dev.metricsFactory.create(property1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.create(property1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(2)
			})
			it('Should to be increased authenticatedPropertiesCount when the create Metrics is the first of Metrics for the Property', async () => {
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(0)
				await dev.metricsFactory.create(property1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.create(property1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(1)
			})
		})
		describe('MetircsFactory; destroy', () => {
			it('Should fail to destroy when passed other than metrics address.', async () => {
				const result = await dev.metricsFactory
					.destroy(dummyMetrics, {
						from: market,
					})
					.catch((err: Error) => err)
				validateErrorMessage(result, 'address is not metrics')
			})
			it('Should fail to destroy when sent from other than a Market. ', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const result = await dev.metricsFactory
					.destroy(m1, {
						from: user,
					})
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('When call the destroy, remove the metrics, emit Destroy event.', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				let result = await dev.metricsFactory.isMetrics(m1)
				expect(result).to.be.equal(true)
				dev.metricsFactory
					.destroy(m1, {
						from: market,
					})
					.catch(console.error)
				const [from, property, metrics] = await new Promise<string[]>(
					(resolve) => {
						watch(dev.metricsFactory)('Destroy', (_, values) => {
							const { _market, _property, _metrics } = values
							resolve([_market, _property, _metrics])
						})
					}
				)
				result = await dev.metricsFactory.isMetrics(m1)
				expect(result).to.be.equal(false)
				expect(market).to.be.equal(from)
				expect(property1).to.be.equal(property)
				expect(m1).to.be.equal(metrics)
			})
			it('can not also run the destroy method in owner.', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const result = await dev.metricsFactory.isMetrics(m1)
				expect(result).to.be.equal(true)
				const destroｙResult = await dev.metricsFactory
					.destroy(m1, {
						from: deployer,
					})
					.catch((err: Error) => err)
				validateAddressErrorMessage(destroｙResult)
			})
			it('Should to be decerased metricsCount always', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const m2 = await dev.metricsFactory
					.create(property2, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(2)

				await dev.metricsFactory.destroy(m1, {
					from: market,
				})
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.destroy(m2, {
					from: market,
				})
				expect(
					await dev.metricsFactory.metricsCount().then((x) => x.toNumber())
				).to.be.equal(0)
			})
			it('Should to be decerased metricsOfProperty always', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const m2 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(2)

				await dev.metricsFactory.destroy(m1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(1)

				await dev.metricsFactory.destroy(m2, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsOfProperty(property1)
						.then((x) => x.length)
				).to.be.equal(0)
				expect(await dev.metricsFactory.metricsOfProperty(property1)).to.be.eql(
					[]
				)
			})
			it('Should to be decreased metricsCountPerProperty always', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const m2 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(2)

				await dev.metricsFactory.destroy(m1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.destroy(m2, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.metricsCountPerProperty(property1)
						.then((x) => x.toNumber())
				).to.be.equal(0)
			})
			it('Should to be decreased authenticatedPropertiesCount when the destroyed Metrics is the last of Metrics for the Property', async () => {
				const m1 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				const m2 = await dev.metricsFactory
					.create(property1, {
						from: market,
					})
					.then(getMetricsAddress)
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.destroy(m1, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(1)

				await dev.metricsFactory.destroy(m2, {
					from: market,
				})
				expect(
					await dev.metricsFactory
						.authenticatedPropertiesCount()
						.then((x) => x.toNumber())
				).to.be.equal(0)
			})
		})
	}
)
