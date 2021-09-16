import { generateAddressRegistryInstances } from './lib/instance/address-registry'
import {
	generateDevInstances,
	setDevAddressToRegistry,
} from './lib/instance/dev'
import {
	generateLockupInstances,
	setLockupAddressToRegistry,
} from './lib/instance/lockup'
import {
	generateMarketFactoryInstances,
	setMarketFactoryAddressToRegistry,
} from './lib/instance/market-factory'
import {
	generateMetricsFactoryInstances,
	setMetricsFactoryAddressToRegistry,
} from './lib/instance/metrics-factory'
import {
	generatePolicyFactoryInstances,
	setPolicyFactoryAddressToRegistry,
} from './lib/instance/policy-factory'
import {
	generatePropertyFactoryInstances,
	setPropertyFactoryAddressToRegistry,
} from './lib/instance/property-factory'
import {
	generateWithdrawInstances,
	setWithdrawAddressToRegistry,
} from './lib/instance/withdraw'
import {
	generatePolicyInstance,
	setPolicyAddressToRegistry,
} from './lib/instance/policy'

const handler = async (
	callback: (err: Error | null) => void
): Promise<void> => {
	// Address Registry
	const addressRegistry = await generateAddressRegistryInstances()

	// Dev
	const dev = await generateDevInstances()
	await setDevAddressToRegistry(addressRegistry, dev)

	// Lockup
	const lockup = await generateLockupInstances()
	await setLockupAddressToRegistry(addressRegistry, lockup)

	// Market Factory
	const marketFactory = await generateMarketFactoryInstances()
	await setMarketFactoryAddressToRegistry(addressRegistry, marketFactory)

	// Metrics Factory
	const metricsFactory = await generateMetricsFactoryInstances()
	await setMetricsFactoryAddressToRegistry(addressRegistry, metricsFactory)

	// Policy Factory
	const policyFactory = await generatePolicyFactoryInstances()
	await setPolicyFactoryAddressToRegistry(addressRegistry, policyFactory)

	// Property Factory
	const propertyFactory = await generatePropertyFactoryInstances()
	await setPropertyFactoryAddressToRegistry(addressRegistry, propertyFactory)

	// Withdraw
	const withdraw = await generateWithdrawInstances()
	await setWithdrawAddressToRegistry(addressRegistry, withdraw)

	// Policy
	const policy = await generatePolicyInstance(addressRegistry, 'Policy1')
	await setPolicyAddressToRegistry(addressRegistry, policy)

	callback(null)
}

export = handler
