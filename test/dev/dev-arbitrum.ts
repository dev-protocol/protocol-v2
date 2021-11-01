/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable new-cap */
import { DevProtocolInstance } from '../test-lib/instance'
import { validateErrorMessage } from '../test-lib/utils/error'
import { getEventValue } from '../test-lib/utils/event'

contract('Dev', ([deployer, user1, user2]) => {
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

		it('get l1 token address', async () => {
			const dev = await createDev()
			const l1TokenAddress = await dev.devArbitrum.l1Address()
			const devInstance = await artifacts.require('Dev').at(l1TokenAddress)
			expect(await devInstance.name()).to.equal('Dev')
		})

		it('get ArbSys address', async () => {
			const dev = await createDev()
			const arbSys = await dev.addressRegistry.registries('ArbSys')
			const arbSysInstance = await artifacts.require('ArbSysTest').at(arbSys)
			expect(await arbSysInstance.isTopLevelCall()).to.equal(true)
		})
	})
	describe('DevArbitrum; BridgeMint', () => {
		it('the initial balance is 0', async () => {
			const dev = await createDev()
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(0)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
		})
		it('increase the balance by running the mint', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)
		})
		it('generate event', async () => {
			const dev = await createDev()
			dev.devArbitrum.bridgeMint(deployer, 100)
			const [account, amount] = await Promise.all([
				getEventValue(dev.devArbitrum)('BridgeMint', '_account'),
				getEventValue(dev.devArbitrum)('BridgeMint', '_amount'),
			])
			expect(account).to.equal(deployer)
			expect(amount).to.equal('100')
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)
		})
		it('Additional minting', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.bridgeMint(deployer, 200)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(300)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				300
			)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				300
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)

			await dev.devArbitrum.bridgeBurn(deployer, 50)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(50)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				50
			)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)
			await dev.devArbitrum.bridgeBurn(deployer, 0)
			expect((await dev.devArbitrum.totalSupply()).toNumber()).to.equal(100)
			expect((await dev.devArbitrum.balanceOf(deployer)).toNumber()).to.equal(
				100
			)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
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
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)
			expect(res).to.be.an.instanceof(Error)
		})
		it('When the bidge balance is exceeded, it becomes zero', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			await dev.devArbitrum.mint(deployer, 100)
			await dev.devArbitrum.bridgeBurn(deployer, 150)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
		})
		it('generate BridgeBurn event', async () => {
			const dev = await createDev()
			await dev.devArbitrum.bridgeMint(deployer, 100)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				100
			)
			dev.devArbitrum.bridgeBurn(deployer, 50)
			const [account, amount] = await Promise.all([
				getEventValue(dev.devArbitrum)('BridgeBurn', '_account'),
				getEventValue(dev.devArbitrum)('BridgeBurn', '_amount'),
			])
			expect(account).to.equal(deployer)
			expect(amount).to.equal('50')
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(
				50
			)
		})
		it('generate TxToL1 event', async () => {
			const dev = await createDev()
			await dev.devArbitrum.mint(deployer, 100)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
			dev.devArbitrum.bridgeBurn(deployer, 50)
			const [from, id, data] = await Promise.all([
				getEventValue(dev.devArbitrum)('TxToL1', '_from'),
				getEventValue(dev.devArbitrum)('TxToL1', '_id'),
				getEventValue(dev.devArbitrum)('TxToL1', '_data'),
			])
			expect(from).to.equal(dev.devArbitrum.address)
			expect(id).to.equal('1')
			expect(data).to.equal(
				'0x3f553a310000000000000000000000000000000000000000000000000000000000000032'
			)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
		})
		it('generate L1EscrowMint event', async () => {
			const dev = await createDev()
			await dev.devArbitrum.mint(deployer, 100)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
			dev.devArbitrum.bridgeBurn(deployer, 50)
			const [token, id, amount] = await Promise.all([
				getEventValue(dev.devArbitrum)('L1EscrowMint', '_token'),
				getEventValue(dev.devArbitrum)('L1EscrowMint', '_id'),
				getEventValue(dev.devArbitrum)('L1EscrowMint', '_amount'),
			])
			expect(token).to.equal(await dev.devArbitrum.l1Address())
			expect(id).to.equal('1')
			expect(amount).to.equal('50')
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
		})

		it('call sendTxToL1 func', async () => {
			const dev = await createDev()
			await dev.devArbitrum.mint(deployer, 100)
			expect((await dev.devArbitrum.bridgeBalanceOnL1()).toNumber()).to.equal(0)
			await dev.devArbitrum.bridgeBurn(deployer, 50)
			expect(await dev.arbSys.latestSendTxToL1Arg1()).to.equal(
				await dev.devArbitrum.l1Address()
			)
			const funcData = web3.eth.abi.encodeFunctionSignature(
				'escrowMint(uint256)'
			)
			const argData = web3.eth.abi.encodeParameter('uint256', '50')
			const data = funcData + argData.replace('0x', '')
			expect(await dev.arbSys.latestSendTxToL1Arg2()).to.equal(data)
		})
	})
})
