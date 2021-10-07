/* eslint-disable new-cap */
import { DevInstance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('Dev', ([deployer, user1, user2, dummyMarket]) => {
	const createDev = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDevArbitrum()
		return dev
	}

	const err = (error: Error): Error => error
	describe('DevArbitrum; initialize', () => {
		it('the name is Dev Arbitrum', async () => {
			const dev = await createDev()
			expect(await dev.devArbitrum.name()).to.equal('Dev Arbitrum')
		})

		it('the symbol is DEV', async () => {
			const dev = await createDev()
			expect(await dev.devArbitrum.symbol()).to.equal('DEV')
		})

		it('the decimals is 18', async () => {
			const dev = await createDev()
			expect((await dev.devArbitrum.decimals()).toNumber()).to.equal(18)
		})
		it('the l1Address is deployer', async () => {
			const dev = await createDev()
			expect(await dev.devArbitrum.l1Address()).to.equal(deployer)
		})
		it('deployer has admin role', async () => {
			const dev = await createDev()
			expect(
				await dev.devArbitrum.hasRole(
					await dev.devArbitrum.DEFAULT_ADMIN_ROLE(),
					deployer
				)
			).to.equal(true)
		})
		it('deployer has burner role', async () => {
			const dev = await createDev()
			expect(
				await dev.devArbitrum.hasRole(
					await dev.devArbitrum.BURNER_ROLE(),
					deployer
				)
			).to.equal(true)
		})
		it('deployer has minter role', async () => {
			const dev = await createDev()
			expect(
				await dev.devArbitrum.hasRole(
					await dev.devArbitrum.MINTER_ROLE(),
					deployer
				)
			).to.equal(true)
		})
	})
	describe('DevArbitrum; BridgeMint', () => {
		it('the initial balance is 0', async () => {
			const dev = await createDev()
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(0)
		})
		it('increase the balance by running the mint', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
		})
		it('running with 0', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.bridgeMint(deployer, 0)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
		})
		it('should fail to run mint when sent from other than minter', async () => {
			const dev = await createDev()
			const res = await dev.devArbitrum
				.bridgeMint(deployer, 100, { from: user1 })
				.catch(err)
			validateErrorMessage(res, 'must have minter role to mint')
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(0)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(0)
		})
		it('if the sender has role of granting roles, can add a new minter', async () => {
			const dev = await createDev()
			const mintRoleKey = await dev.devArbitrum.MINTER_ROLE()
			await dev.devArbitrum.grantRole(mintRoleKey, user1)
			expect(await dev.devArbitrum.hasRole(mintRoleKey, user1)).to.equal(true)
			await dev.devArbitrum.grantRole('0x00', user1) // '0x00' is the value of DEFAULT_ADMIN_ROLE defined by the AccessControl

			await dev.devArbitrum.grantRole(mintRoleKey, user2, { from: user1 })
			expect(await dev.devArbitrum.hasRole(mintRoleKey, user2)).to.equal(true)
		})
		it('renounce minter by running renounceRole', async () => {
			const dev = await createDev()
			const mintRoleKey = await dev.devArbitrum.MINTER_ROLE()
			await dev.devArbitrum.grantRole(mintRoleKey, user1)
			expect(await dev.devArbitrum.hasRole(mintRoleKey, user1)).to.equal(true)
			await dev.devArbitrum.renounceRole(mintRoleKey, user1, { from: user1 })
			expect(await dev.devArbitrum.hasRole(mintRoleKey, user1)).to.equal(false)
		})
	})
	describe('DevArbitrum; bridgeBurn', () => {
		it('decrease the balance by running the burn', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.bridgeBurn(deployer, 50)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(50)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				50
			)
		})
		it('running with 0', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.bridgeBurn(deployer, 0)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
		})
		it('should fail to decrease the balance when sent from no balance account', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			const res = await dev.devArbitrum
				.bridgeBurn(deployer, 50, { from: user1 })
				.catch(err)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			validateErrorMessage(res, 'must have burner role to burn')
		})
		it('should fail to if over decrease the balance by running the burnFrom from another account after approved', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.approve(user1, 50)
			const res = await dev.devArbitrum
				.bridgeBurn(deployer, 51, { from: user1 })
				.catch((err: Error) => err)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
			expect(res).to.be.an.instanceof(Error)
		})
	})
})
