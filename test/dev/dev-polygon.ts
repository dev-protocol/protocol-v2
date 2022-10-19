/* eslint-disable new-cap */
import type { DevPolygonInstance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { validateErrorMessage } from '../test-lib/utils/error'
import type { Snapshot } from '../test-lib/utils/snapshot'
import { takeSnapshot, revertToSnapshot } from '../test-lib/utils/snapshot'

contract('DevPolygon', ([deployer, depositer, user]) => {
	const createDev = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDevPolygon()
		return dev
	}

	let dev: DevProtocolInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		dev = await createDev()
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

	const err = (error: Error): Error => error
	describe('DevPolygon; initialize', () => {
		it('the name is Dev Polygon', async () => {
			expect(await dev.devL2.name()).to.equal('Dev Polygon')
		})

		it('the symbol is DEV', async () => {
			expect(await dev.devL2.symbol()).to.equal('DEV')
		})

		it('the decimals is 18', async () => {
			expect((await dev.devL2.decimals()).toNumber()).to.equal(18)
		})
		it('deployer has admin role', async () => {
			expect(
				await dev.devL2.hasRole(await dev.devL2.DEFAULT_ADMIN_ROLE(), deployer)
			).to.equal(true)
		})
		it('deployer has burner role', async () => {
			expect(
				await dev.devL2.hasRole(await dev.devL2.BURNER_ROLE(), deployer)
			).to.equal(true)
		})
		it('deployer has minter role', async () => {
			expect(
				await dev.devL2.hasRole(await dev.devL2.MINTER_ROLE(), deployer)
			).to.equal(true)
		})
	})

	describe('DevPolygon; deposit', () => {
		describe('success', () => {
			it('deployer has depositer role', async () => {
				expect(
					await dev.devL2.hasRole(
						await (dev.devL2 as DevPolygonInstance).DEPOSITOR_ROLE(),
						deployer
					)
				).to.equal(true)
			})
			it('depositer can mint', async () => {
				const depositerRole = await (
					dev.devL2 as DevPolygonInstance
				).DEPOSITOR_ROLE()
				await dev.devL2.grantRole(depositerRole, depositer)
				const param = web3.eth.abi.encodeParameter('uint256', '2345675643')
				const beforeBalance = await dev.devL2.balanceOf(user)
				expect(beforeBalance.toString()).to.equal('0')
				await (dev.devL2 as DevPolygonInstance).deposit(user, param, {
					from: depositer,
				})
				const afterBalance = await dev.devL2.balanceOf(user)
				expect(afterBalance.toString()).to.equal('2345675643')
			})
		})
		describe('fail', () => {
			it('depositer can mint', async () => {
				const param = web3.eth.abi.encodeParameter('uint256', '2345675643')
				const res = await (dev.devL2 as DevPolygonInstance)
					.deposit(user, param, { from: depositer })
					.catch(err)
				validateErrorMessage(res, 'is missing role', false)
			})
		})
	})

	describe('DevPolygon; withdraw', () => {
		describe('success', () => {
			it('token buned', async () => {
				await dev.devL2.mint(user, 100)
				const beforeBalance = await dev.devL2.balanceOf(user)
				expect(beforeBalance.toString()).to.equal('100')
				await (dev.devL2 as DevPolygonInstance).withdraw(50, { from: user })
				const afterBalance = await dev.devL2.balanceOf(user)
				expect(afterBalance.toString()).to.equal('50')
			})
		})
	})
})
