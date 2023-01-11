import PQueue from 'p-queue'
import { forceImport } from '@openzeppelin/truffle-upgrades'
import { addresses } from '@devprotocol/dev-kit'

const queue = new PQueue({ concurrency: 1 })

const handler = async function (_, network) {
	if (network === 'test') {
		return
	}

	const map =
		network === 'arbitrum_mainnet'
			? addresses.arbitrum.one
			: network === 'polygon_mainnet'
			? addresses.polygon.mainnet
			: network === 'polygon_testnet'
			? addresses.polygon.mumbai
			: (undefined as never)

	const token = network.includes('arbitrum')
		? artifacts.require('DevArbitrum')
		: network.includes('polygon')
		? artifacts.require('DevPolygon')
		: (undefined as never)

	await queue.addAll(
		Object.keys(map).map((_key) => async () => {
			const key = _key as keyof typeof map
			if (key === 'token') {
				await forceImport(map[key], token as any)
				console.log('Done:', key, map[key])
				return
			}

			const contract =
				key === 'lockup'
					? 'Lockup'
					: key === 'marketFactory'
					? 'MarketFactory'
					: key === 'metricsFactory'
					? 'MetricsFactory'
					: key === 'policyFactory'
					? 'PolicyFactory'
					: key === 'propertyFactory'
					? 'PropertyFactory'
					: key === 'registry'
					? 'AddressRegistry'
					: key === 'sTokens'
					? 'STokensManager'
					: key === 'withdraw'
					? 'Withdraw'
					: (undefined as never)
			await forceImport(map[key], artifacts.require(contract))
			console.log('Done:', key, map[key])
		})
	)
} as Truffle.Migration

export = handler
