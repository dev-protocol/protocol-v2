import {
	AddressRegistryInstance,
	DevInstance,
	LockupInstance,
	PropertyFactoryInstance,
	PolicyFactoryTestInstance,
	MarketFactoryTestInstance,
	MetricsFactoryTestInstance,
	IPolicyInstance,
	IMarketBehaviorInstance,
	WithdrawTestInstance,
	MetricsInstance,
	TreasuryTestInstance,
	IPolicyContract,
	STokensManagerInstance,
	DevMinterInstance,
	AdminInstance,
} from '../../types/truffle-contracts'

type ContractInstance = {
	at: any
	new: any
}

export const deployProxy = async <L extends ContractInstance>(
	logic: L,
	deployer: string
): Promise<[ReturnType<L['at']>, AdminInstance]> => {
	const [admin, impl] = await Promise.all([
		contract('Admin').new(),
		logic.new(),
	])
	const proxy = await contract('Proxy').new(
		impl.address,
		admin.address,
		web3.utils.fromUtf8(''),
		{ from: deployer }
	)
	const [wrap] = await Promise.all([logic.at(proxy.address)])
	return [wrap, admin]
}

const contract = artifacts.require

export class DevProtocolInstance {
	private readonly _deployer: string

	private _addressRegistry!: AddressRegistryInstance
	private _dev!: DevInstance
	private _lockup!: LockupInstance
	private _propertyFactory!: PropertyFactoryInstance
	private _policyFactory!: PolicyFactoryTestInstance
	private _marketFactory!: MarketFactoryTestInstance
	private _metricsFactory!: MetricsFactoryTestInstance
	private _withdraw!: WithdrawTestInstance
	private _treasury!: TreasuryTestInstance
	private _devMinter!: DevMinterInstance
	private _sTokensManager!: STokensManagerInstance
	private readonly _policy!: IPolicyContract

	constructor(deployer: string) {
		this._deployer = deployer
	}

	public get fromDeployer(): { from: string } {
		return { from: this._deployer }
	}

	public get addressRegistry(): AddressRegistryInstance {
		return this._addressRegistry
	}

	public get devMinter(): DevMinterInstance {
		return this._devMinter
	}

	public get dev(): DevInstance {
		return this._dev
	}

	public get lockup(): LockupInstance {
		return this._lockup
	}

	public get propertyFactory(): PropertyFactoryInstance {
		return this._propertyFactory
	}

	public get policyFactory(): PolicyFactoryTestInstance {
		return this._policyFactory
	}

	public get marketFactory(): MarketFactoryTestInstance {
		return this._marketFactory
	}

	public get metricsFactory(): MetricsFactoryTestInstance {
		return this._metricsFactory
	}

	public get withdraw(): WithdrawTestInstance {
		return this._withdraw
	}

	public get treasury(): TreasuryTestInstance {
		return this._treasury
	}

	public get sTokensManager(): STokensManagerInstance {
		return this._sTokensManager
	}

	public async generateAddressRegistry(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('AddressRegistry'),
			this._deployer
		)
		await proxfied.initialize()
		this._addressRegistry = proxfied
	}

	public async generateDevMinter(): Promise<void> {
		const [proxfied] = await deployProxy(contract('DevMinter'), this._deployer)
		await proxfied.initialize(this._addressRegistry.address)
		this._devMinter = proxfied
		await this._dev.grantRole(
			web3.utils.keccak256('MINTER_ROLE'),
			this._devMinter.address
		)
		await this._dev.grantRole(
			web3.utils.keccak256('BURNER_ROLE'),
			this._devMinter.address
		)
		await this.addressRegistry.setRegistry(
			'DevMinter',
			this._devMinter.address,
			this.fromDeployer
		)
	}

	public async generateDev(): Promise<void> {
		const [proxfied] = await deployProxy(contract('Dev'), this._deployer)
		await proxfied.initializeDev(this._addressRegistry.address)
		this._dev = proxfied
		await this.addressRegistry.setRegistry(
			'Dev',
			this._dev.address,
			this.fromDeployer
		)
	}

	public async generateSTokensManager(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('STokensManager'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._sTokensManager = proxfied
		await this.addressRegistry.setRegistry(
			'STokensManager',
			this._sTokensManager.address,
			this.fromDeployer
		)
	}

	public async generateLockup(): Promise<void> {
		const [proxfied] = await deployProxy(contract('Lockup'), this._deployer)
		await proxfied.initialize(this._addressRegistry.address)
		this._lockup = proxfied
		await this.addressRegistry.setRegistry(
			'Lockup',
			this._lockup.address,
			this.fromDeployer
		)
	}

	public async generatePropertyFactory(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('PropertyFactory'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._propertyFactory = proxfied
		await this.addressRegistry.setRegistry(
			'PropertyFactory',
			this._propertyFactory.address,
			this.fromDeployer
		)
	}

	public async generatePolicyFactory(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('PolicyFactoryTest'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._policyFactory = proxfied
		await this.addressRegistry.setRegistry(
			'PolicyFactory',
			this._policyFactory.address,
			this.fromDeployer
		)
	}

	public async generateMarketFactory(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('MarketFactoryTest'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._marketFactory = proxfied
		await this.addressRegistry.setRegistry(
			'MarketFactory',
			this._marketFactory.address,
			this.fromDeployer
		)
	}

	public async generateMetricsFactory(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('MetricsFactoryTest'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._metricsFactory = proxfied
		await this.addressRegistry.setRegistry(
			'MetricsFactory',
			this._metricsFactory.address,
			this.fromDeployer
		)
	}

	public async generateWithdraw(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('WithdrawTest'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._withdraw = proxfied
		await this.addressRegistry.setRegistry(
			'Withdraw',
			this._withdraw.address,
			this.fromDeployer
		)
	}

	public async generatePolicy(
		policyContractName = 'PolicyTestBase'
	): Promise<string> {
		const policy = await contract(policyContractName).new()
		await this._policyFactory.create(policy.address)
		return policy.address
	}

	public async generateTreasury(): Promise<void> {
		const [proxfied] = await deployProxy(
			contract('TreasuryTest'),
			this._deployer
		)
		await proxfied.initialize(this._addressRegistry.address)
		this._treasury = proxfied
		await this.addressRegistry.setRegistry(
			'Treasury',
			this._treasury.address,
			this.fromDeployer
		)
	}

	public async setCapSetter(_capSetter = ''): Promise<void> {
		if (_capSetter === '') {
			_capSetter = this._deployer
		}

		await this.addressRegistry.setRegistry(
			'CapSetter',
			this._deployer,
			this.fromDeployer
		)
	}

	public async getPolicy(
		contractName: string,
		user: string
	): Promise<IPolicyInstance> {
		const tmp = await contract(contractName).new({ from: user })
		return tmp
	}

	public async getMarket(
		contractName: string,
		user: string
	): Promise<IMarketBehaviorInstance> {
		const tmp = await contract(contractName).new(this.addressRegistry.address, {
			from: user,
		})
		return tmp
	}

	public async createMetrics(
		market: string,
		property: string
	): Promise<MetricsInstance> {
		return contract('Metrics').new(market, property)
	}

	public async updateCap(
		value = '115792089237316000000000000000000000'
	): Promise<void> {
		await this._lockup.updateCap(value)
	}
}
