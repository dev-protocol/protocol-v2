import { deployProxy, DevProtocolInstance } from '../test-lib/instance'
import { DevMinterInstance } from '../../types/truffle-contracts'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('DevMinter', ([deployer, user1, lockup, withdraw]) => {
	const createDevInstance = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevMinter()
		await dev.addressRegistry.setRegistry('Lockup', lockup)
		await dev.addressRegistry.setRegistry('Withdraw', withdraw)
		return dev
	}

	const createDevInstanceNotAddMinter =
		async (): Promise<DevMinterInstance> => {
			const contract = artifacts.require

			const addressRegistry = await deployProxy(
				contract('AddressRegistry'),
				deployer
			)
			await addressRegistry.initialize()

			const dev = await contract('Dev').new(addressRegistry.address, {
				from: deployer,
			})
			await addressRegistry.setRegistry('Dev', dev.address, {
				from: deployer,
			})
			const devMinter = await deployProxy(contract('DevMinter'), deployer)
			await devMinter.initialize(addressRegistry.address)

			await addressRegistry.setRegistry('Lockup', lockup, {
				from: deployer,
			})
			await addressRegistry.setRegistry('Withdraw', withdraw, {
				from: deployer,
			})
			return devMinter
		}

	describe('mint', () => {
		describe('success', () => {
			it('If DevMinter has minter privileges, it can mint Dev tokens.(Lockup)', async () => {
				const dev = await createDevInstance()
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devMinter.mint(user1, 100, { from: lockup })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
			it('If DevMinter has minter privileges, it can mint Dev tokens.(withdraw)', async () => {
				const dev = await createDevInstance()
				const before = await dev.dev.balanceOf(user1)
				expect(before.toString()).to.equal('0')
				await dev.devMinter.mint(user1, 100, { from: withdraw })
				const after = await dev.dev.balanceOf(user1)
				expect(after.toString()).to.equal('100')
			})
		})
		describe('fail', () => {
			it('If DevMinter does not has minter privileges, it can not mint Dev tokens', async () => {
				const devMinter = await createDevInstanceNotAddMinter()
				const result = await devMinter
					.mint(user1, 100, { from: withdraw })
					.catch((err: Error) => err)
				validateErrorMessage(
					result,
					'ERC20PresetMinterPauser: must have minter role to mint'
				)
			})
			it('Error when minting from other than Lockup and Withdraw contracts', async () => {
				const dev = await createDevInstance()
				const result = await dev.devMinter
					.mint(user1, 100)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
		})
	})
	describe('renounceMinter', () => {
		describe('success', () => {
			it('we can remove mint privileges.', async () => {
				const dev = await createDevInstance()
				const role = web3.utils.keccak256('MINTER_ROLE')
				const before = await dev.dev.hasRole(role, dev.devMinter.address)
				expect(before).to.equal(true)
				await dev.devMinter.renounceMinter()
				const after = await dev.dev.hasRole(role, dev.devMinter.address)
				expect(after).to.equal(false)
				const result = await dev.devMinter
					.mint(user1, 100, { from: withdraw })
					.catch((err: Error) => err)
				validateErrorMessage(
					result,
					'ERC20PresetMinterPauser: must have minter role to mint'
				)
			})
		})
		describe('fail', () => {
			it('Only the owner can run it.', async () => {
				const dev = await createDevInstance()
				const result = await dev.devMinter
					.renounceMinter({ from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Ownable: caller is not the owner')
			})
		})
	})
})
