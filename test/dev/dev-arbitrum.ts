/* eslint-disable new-cap */
import { DevInstance } from '../../types/truffle-contracts'
import { DevProtocolInstance } from '../test-lib/instance'
import { validateErrorMessage } from '../test-lib/utils/error'

contract('Dev', ([deployer, user1, user2, dummyMarket]) => {
	const createDev = async (): Promise<DevProtocolInstance> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevArbitrum()
		await dev.generateDevBridge()
		return dev
	}

	const err = (error: Error): Error => error
	describe('Dev; initialize', () => {
		it('the name is Dev', async () => {
			const dev = await createDev()
			expect(await dev.devArbitrum.name()).to.equal('Dev')
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
	})
})
