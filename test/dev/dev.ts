/* eslint-disable new-cap */
import { DevInstance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('Dev', ([deployer, user1, user2]) => {
	const createDev = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevBridge()
		return dev
	}

	const err = (error: Error): Error => error
	describe('Dev; initialize', () => {
		it('the name is Dev', async () => {
			const dev = await createDev()
			expect(await dev.dev.name()).to.equal('Dev')
		})

		it('the symbol is DEV', async () => {
			const dev = await createDev()
			expect(await dev.dev.symbol()).to.equal('DEV')
		})

		it('the decimals is 18', async () => {
			const dev = await createDev()
			expect((await dev.dev.decimals()).toNumber()).to.equal(18)
		})
		it('deployer has admin role', async () => {
			const dev = await createDev()
			expect(
				await dev.dev.hasRole(await dev.dev.DEFAULT_ADMIN_ROLE(), deployer)
			).to.equal(true)
		})
		it('deployer has burner role', async () => {
			const dev = await createDev()
			expect(
				await dev.dev.hasRole(await dev.dev.BURNER_ROLE(), deployer)
			).to.equal(true)
		})
		it('deployer has minter role', async () => {
			const dev = await createDev()
			expect(
				await dev.dev.hasRole(await dev.dev.MINTER_ROLE(), deployer)
			).to.equal(true)
		})
	})
	describe('Dev; mint', () => {
		it('the initial balance is 0', async () => {
			const dev = await createDev()
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(0)
		})
		it('increase the balance by running the mint', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)
		})
		it('running with 0', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)

			await dev.dev.mint(deployer, 0)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)
		})
		it('should fail to run mint when sent from other than minter', async () => {
			const dev = await createDev()
			const res = await dev.dev.mint(deployer, 100, { from: user1 }).catch(err)
			validateErrorMessage(res, 'must have minter role to mint')
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(0)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(0)
		})
		it('if the sender has role of granting roles, can add a new minter', async () => {
			const dev = await createDev()
			const mintRoleKey = await dev.dev.MINTER_ROLE()
			await dev.dev.grantRole(mintRoleKey, user1)
			expect(await dev.dev.hasRole(mintRoleKey, user1)).to.equal(true)
			await dev.dev.grantRole('0x00', user1) // '0x00' is the value of DEFAULT_ADMIN_ROLE defined by the AccessControl

			await dev.dev.grantRole(mintRoleKey, user2, { from: user1 })
			expect(await dev.dev.hasRole(mintRoleKey, user2)).to.equal(true)
		})
		it('renounce minter by running renounceRole', async () => {
			const dev = await createDev()
			const mintRoleKey = await dev.dev.MINTER_ROLE()
			await dev.dev.grantRole(mintRoleKey, user1)
			expect(await dev.dev.hasRole(mintRoleKey, user1)).to.equal(true)
			await dev.dev.renounceRole(mintRoleKey, user1, { from: user1 })
			expect(await dev.dev.hasRole(mintRoleKey, user1)).to.equal(false)
		})
	})
	describe('Dev; burn', () => {
		it('decrease the balance by running the burn', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)

			await dev.dev.burn(deployer, 50)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(50)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(50)
		})
		it('running with 0', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)

			await dev.dev.burn(deployer, 0)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)
		})
		it('should fail to decrease the balance when sent from no balance account', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)

			const res = await dev.dev.burn(deployer, 50, { from: user1 }).catch(err)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			validateErrorMessage(res, 'must have burner role to burn')
		})
		it('should fail to if over decrease the balance by running the burnFrom from another account after approved', async () => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)

			await dev.dev.approve(user1, 50)
			const res = await dev.dev
				.burn(deployer, 51, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.dev.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect(res).to.be.an.instanceof(Error)
		})
	})
	describe('Dev; transfer', () => {
		const createMintedDev = async (): Promise<DevInstance> => {
			const dev = await createDev()
			await dev.dev.mint(deployer, 100)
			return dev.dev
		}

		it('transfer token from user-to-user', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.transfer(user1, 50)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(50)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(50)
		})
		it('transfer 0 tokens from user-to-user', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.transfer(user1, 0)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)
		})
		it('should fail to transfer token when sent from no balance account', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(0)

			const res = await dev
				.transfer(user2, 50, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(0)
			expect(res).to.be.an.instanceof(Error)
		})
		it('should fail to transfer token when sent from an insufficient balance account', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			const res = await dev.transfer(user1, 101).catch((err: Error) => err)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)
			expect(res).to.be.an.instanceof(Error)
		})
		it('transfer token from user-to-user by running the transferFrom from another account after approved', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.approve(user1, 50)
			await dev.transferFrom(deployer, user2, 50, { from: user1 })
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(50)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(50)
		})
		it('should fail to transfer token from user-to-user when running the transferFrom of over than approved amount from another account after approved', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.approve(user1, 50)
			const res = await dev
				.transferFrom(deployer, user2, 51, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(0)
			expect(res).to.be.an.instanceof(Error)
		})
		it('increase the approved amount after approved', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.approve(user1, 50)
			const res = await dev
				.transferFrom(deployer, user2, 51, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(0)
			expect(res).to.be.an.instanceof(Error)

			await dev.increaseAllowance(user1, 1)
			await dev.transferFrom(deployer, user2, 50, { from: user1 })
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(50)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(50)
		})
		it('decrease the approved amount after approved', async () => {
			const dev = await createMintedDev()
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user1)).toNumber()).to.equal(0)

			await dev.approve(user1, 50)
			await dev.decreaseAllowance(user1, 1)
			const res = await dev
				.transferFrom(deployer, user2, 50, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.balanceOf(deployer)).toNumber()).to.equal(100)
			expect((await dev.balanceOf(user2)).toNumber()).to.equal(0)
			expect(res).to.be.an.instanceof(Error)
		})
	})
})
