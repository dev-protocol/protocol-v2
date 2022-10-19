import { DevProtocolInstance } from '../test-lib/instance'
import { getPropertyAddress, getTransferToAddress } from '../test-lib/utils/log'
import {
	validateErrorMessage,
	validateAddressErrorMessage,
} from '../test-lib/utils/error'
import { DEFAULT_ADDRESS } from '../test-lib/const'
import { toBigNumber, splitValue } from '../test-lib/utils/common'
import type { Snapshot } from '../test-lib/utils/snapshot'
import { takeSnapshot, revertToSnapshot } from '../test-lib/utils/snapshot'

contract(
	'PropertyTest',
	([deployer, author, user, propertyFactory, lockup, transfer]) => {
		const propertyContract = artifacts.require('Property')
		const init = async (): Promise<DevProtocolInstance> => {
			const dev = new DevProtocolInstance(deployer)
			await dev.generateAddressRegistry()
			await dev.generateDev()
			await dev.generateDevBridge()
			await dev.generateSTokensManager()
			await dev.generatePolicyFactory()
			await dev.generateLockup()
			await dev.generateMetricsFactory()
			await dev.generatePolicy()
			await dev.generateTreasury()
			await dev.setCapSetter()
			await dev.updateCap()

			return dev
		}

		let dev: DevProtocolInstance
		let snapshot: Snapshot
		let snapshotId: string

		before(async () => {
			dev = await init()
		})

		beforeEach(async () => {
			snapshot = (await takeSnapshot()) as Snapshot
			snapshotId = snapshot.result
		})

		afterEach(async () => {
			await revertToSnapshot(snapshotId)
		})

		describe('Property; getBalances', () => {
			it('author and treasury hold the balance.', async () => {
				await dev.generatePropertyFactory()
				const transaction = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author
				)
				const propertyAddress = getPropertyAddress(transaction)
				const propertyInstance = await propertyContract.at(propertyAddress)
				const balances = await propertyInstance.getBalances()
				expect(balances[0].account).to.be.equal(author)
				expect(balances[0].balance.toString()).to.be.equal(
					'9500000000000000000000000'
				)
				expect(balances[1].account).to.be.equal(dev.treasury.address)
				expect(balances[1].balance.toString()).to.be.equal(
					'500000000000000000000000'
				)
			})
			it('The balance will be transferred(transfer).', async () => {
				await dev.generatePropertyFactory()
				await dev.generateWithdraw()
				const transaction = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author
				)
				const propertyAddress = getPropertyAddress(transaction)
				const propertyInstance = await propertyContract.at(propertyAddress)
				await propertyInstance.transfer(user, '500000000000000000000000', {
					from: author,
				})
				const balances = await propertyInstance.getBalances()
				expect(balances[0].account).to.be.equal(author)
				expect(balances[0].balance.toString()).to.be.equal(
					'9000000000000000000000000'
				)
				expect(balances[1].account).to.be.equal(dev.treasury.address)
				expect(balances[1].balance.toString()).to.be.equal(
					'500000000000000000000000'
				)
				expect(balances[2].account).to.be.equal(user)
				expect(balances[2].balance.toString()).to.be.equal(
					'500000000000000000000000'
				)
			})
			it('The balance will be transferred(transferFrom).', async () => {
				await dev.generatePropertyFactory()
				await dev.generateWithdraw()
				const transaction = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author
				)
				const propertyAddress = getPropertyAddress(transaction)
				const propertyInstance = await propertyContract.at(propertyAddress)
				await propertyInstance.approve(deployer, '500000000000000000000000', {
					from: author,
				})
				await propertyInstance.transferFrom(
					author,
					user,
					'500000000000000000000000'
				)
				const balances = await propertyInstance.getBalances()
				expect(balances[0].account).to.be.equal(author)
				expect(balances[0].balance.toString()).to.be.equal(
					'9000000000000000000000000'
				)
				expect(balances[1].account).to.be.equal(dev.treasury.address)
				expect(balances[1].balance.toString()).to.be.equal(
					'500000000000000000000000'
				)
				expect(balances[2].account).to.be.equal(user)
				expect(balances[2].balance.toString()).to.be.equal(
					'500000000000000000000000'
				)
			})
		})

		describe('Property; constructor', () => {
			it('Cannot be created from other than factory', async () => {
				const result = await propertyContract
					.new(dev.addressRegistry.address, author, 'sample', 'SAMPLE', {
						from: deployer,
					})
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('The author, decimal places, and number of issues are fixed values', async () => {
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				const propertyInstance = await propertyContract.new(
					dev.addressRegistry.address,
					author,
					'sample',
					'SAMPLE',
					{
						from: propertyFactory,
					}
				)
				const tenMillion = toBigNumber(1000).times(10000).times(1e18)
				expect(await propertyInstance.author()).to.be.equal(author)
				expect((await propertyInstance.decimals()).toNumber()).to.be.equal(18)
				const authorBalance = await propertyInstance
					.balanceOf(author)
					.then(toBigNumber)
				const treasuryBalance = await propertyInstance
					.balanceOf(dev.treasury.address)
					.then(toBigNumber)
				const [predictedAutherBalance, predictedTreasuryBalance] =
					splitValue(tenMillion)
				expect(authorBalance.toFixed()).to.be.equal(
					predictedAutherBalance.toFixed()
				)
				expect(treasuryBalance.toFixed()).to.be.equal(
					predictedTreasuryBalance.toFixed()
				)
				expect(
					(await propertyInstance.totalSupply().then(toBigNumber)).toFixed()
				).to.be.equal(tenMillion.toFixed())
			})
		})
		describe('Property; changeName', () => {
			it('Should fail to call when the sender is not author', async () => {
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				const propertyInstance = await propertyContract.new(
					dev.addressRegistry.address,
					author,
					'sample',
					'SAMPLE',
					{
						from: propertyFactory,
					}
				)
				const result = await propertyInstance
					.changeName('next-name')
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal sender')
			})
			it('Change the name', async () => {
				await dev.generatePropertyFactory()
				const transaction = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author
				)
				const propertyAddress = getPropertyAddress(transaction)
				const propertyInstance = await propertyContract.at(propertyAddress)
				expect(await propertyInstance.name()).to.be.equal('sample')
				await propertyInstance.changeName('next-name', {
					from: author,
				})
				expect(await propertyInstance.name()).to.be.equal('next-name')
			})
			it('Should emit ChangeName event', async () => {
				await dev.generatePropertyFactory()
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				const propertyInstance = await propertyContract.new(
					dev.addressRegistry.address,
					author,
					'sample',
					'SAMPLE',
					{
						from: propertyFactory,
					}
				)
				const result = await propertyInstance.changeName('next', {
					from: author,
				})
				const event = result.logs[0].args as { _old: string; _new: string }
				expect(result.logs[0].event).to.be.equal('ChangeName')
				expect(event._old).to.be.equal('sample')
				expect(event._new).to.be.equal('next')
			})
		})
		describe('Property; changeSymbol', () => {
			it('Should fail to call when the sender is not author', async () => {
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				const propertyInstance = await propertyContract.new(
					dev.addressRegistry.address,
					author,
					'sample',
					'SAMPLE',
					{
						from: propertyFactory,
					}
				)
				const result = await propertyInstance
					.changeSymbol('NEXTSYMBOL')
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal sender')
			})
			it('Change the symbol', async () => {
				await dev.generatePropertyFactory()
				const transaction = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author
				)
				const propertyAddress = getPropertyAddress(transaction)
				const propertyInstance = await propertyContract.at(propertyAddress)
				expect(await propertyInstance.symbol()).to.be.equal('SAMPLE')
				await propertyInstance.changeSymbol('NEXTSYMBOL', {
					from: author,
				})
				expect(await propertyInstance.symbol()).to.be.equal('NEXTSYMBOL')
			})
			it('Should emit ChangeSymbol event', async () => {
				await dev.generatePropertyFactory()
				await dev.addressRegistry.setRegistry(
					'PropertyFactory',
					propertyFactory
				)
				const propertyInstance = await propertyContract.new(
					dev.addressRegistry.address,
					author,
					'sample',
					'SAMPLE',
					{
						from: propertyFactory,
					}
				)
				const result = await propertyInstance.changeSymbol('NEXT', {
					from: author,
				})
				const event = result.logs[0].args as { _old: string; _new: string }
				expect(result.logs[0].event).to.be.equal('ChangeSymbol')
				expect(event._old).to.be.equal('SAMPLE')
				expect(event._new).to.be.equal('NEXT')
			})
		})
		describe('Property; withdraw', () => {
			const dev = new DevProtocolInstance(deployer)
			let propertyAddress: string
			before(async () => {
				await dev.generateAddressRegistry()
				await dev.generateDev()
				await dev.generateDevBridge()
				await dev.generateSTokensManager()
				await Promise.all([
					dev.generatePropertyFactory(),
					dev.generatePolicyFactory(),
					dev.generateLockup(),
					dev.generateMetricsFactory(),
				])
				await dev.generatePolicy()
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				const result = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author,
					{
						from: user,
					}
				)
				propertyAddress = getPropertyAddress(result)
			})
			it('When executed from other than the lockup address', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.withdraw(user, 10, { from: deployer })
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('Dev token balance does not exist in property contract', async () => {
				await dev.addressRegistry.setRegistry('Lockup', lockup)
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.withdraw(user, 10, { from: lockup })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'ERC20: transfer amount exceeds balance')
			})
			it('Dev token balance does not exist in property contract', async () => {
				await dev.addressRegistry.setRegistry('Lockup', lockup)
				await dev.dev.mint(propertyAddress, 10)
				const property = await propertyContract.at(propertyAddress)
				await property.withdraw(user, 10, { from: lockup })
			})
		})
		describe('Property; transfer', () => {
			const dev = new DevProtocolInstance(deployer)
			let propertyAddress: string
			before(async () => {
				await dev.generateAddressRegistry()
				await dev.generateDev()
				await dev.generateDevBridge()
				await dev.generateSTokensManager()
				await Promise.all([
					dev.generateWithdraw(),
					dev.generatePropertyFactory(),
					dev.generateLockup(),
					dev.generatePolicyFactory(),
					dev.generateMetricsFactory(),
				])
				await dev.generatePolicy('PolicyTestForProperty')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				const result = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author,
					{
						from: user,
					}
				)
				propertyAddress = getPropertyAddress(result)
			})
			it('An error occurs if the address is invalid', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transfer(DEFAULT_ADDRESS, 10, { from: user })
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('An error occurs if the value is invalid', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transfer(transfer, 0, { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal transfer value')
			})
			it('transfer success', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property.transfer(transfer, 10, { from: author })
				const toAddress = getTransferToAddress(result)
				expect(toAddress).to.be.equal(transfer)
			})
		})
		describe('Property; transferFrom', () => {
			const dev = new DevProtocolInstance(deployer)
			let propertyAddress: string
			before(async () => {
				await dev.generateAddressRegistry()
				await dev.generateDev()
				await dev.generateDevBridge()
				await dev.generateSTokensManager()
				await Promise.all([
					dev.generateWithdraw(),
					dev.generatePropertyFactory(),
					dev.generateLockup(),
					dev.generatePolicyFactory(),
					dev.generateMetricsFactory(),
				])
				await dev.generatePolicy('PolicyTestForProperty')
				await dev.generateTreasury()
				await dev.setCapSetter()
				await dev.updateCap()
				const result = await dev.propertyFactory.create(
					'sample',
					'SAMPLE',
					author,
					{
						from: user,
					}
				)
				propertyAddress = getPropertyAddress(result)
			})
			it('An error occurs if the from address is invalid', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transferFrom(DEFAULT_ADDRESS, transfer, 10, { from: user })
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('An error occurs if the to address is invalid', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transferFrom(transfer, DEFAULT_ADDRESS, 10, { from: user })
					.catch((err: Error) => err)
				validateAddressErrorMessage(result)
			})
			it('An error occurs if the value is invalid', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transferFrom(author, transfer, 0, { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal transfer value')
			})
			it('get an error, dont have enough allowance', async () => {
				const property = await propertyContract.at(propertyAddress)
				const result = await property
					.transferFrom(author, transfer, 10, {
						from: author,
					})
					.catch((err: Error) => err)
				validateErrorMessage(
					result,
					'Returned error: VM Exception while processing transaction: revert',
					false
				)
			})
			it('transfer success', async () => {
				const property = await propertyContract.at(propertyAddress)
				await property.approve(author, 10, {
					from: author,
				})
				const result = await property.transferFrom(author, transfer, 10, {
					from: author,
				})
				const toAddress = getTransferToAddress(result)
				expect(toAddress).to.be.equal(transfer)
			})
		})
	}
)
