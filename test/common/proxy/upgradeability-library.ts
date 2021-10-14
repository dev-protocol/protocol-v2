/* eslint-disable @typescript-eslint/no-floating-promises */
import { UpgradeabilityLibraryV1Instance } from '../../../types/truffle-contracts'
import { deployProxy } from '../../test-lib/instance'
import { getEventValue } from '../../test-lib/utils/event'

contract('UpgradeabilityLibrary ', ([deployer, address, user]) => {
	describe('Same data', () => {
		let contract: UpgradeabilityLibraryV1Instance

		before(async () => {
			contract = await deployProxy(
				artifacts.require('UpgradeabilityLibraryV1'),
				deployer
			)
			await contract.initialize()
		})
		it('Store data', async () => {
			await Promise.all([
				contract.setTestValue(5),
				contract.upCounter(),
				contract.addEnumerableSet(10),
				contract.addEnumerableSet(20),
			])

			expect((await contract.getCounter()).toString()).to.equal('1')
			const eSet = await contract.getEnumerableSet()
			expect(eSet.length).to.equal(2)
			const converted = eSet.map((v) => v.toNumber())
			expect(converted.includes(10)).to.equal(true)
			expect(converted.includes(20)).to.equal(true)
			expect((await contract.testValue()).toString()).to.equal('5')
		})
		it('Should data be upgradable', async () => {
			const newImpl = await artifacts.require('UpgradeabilityLibraryV2').new()
			contract.upgradeTo(newImpl.address)
			const [implementation] = await Promise.all([
				getEventValue(contract)('Upgraded', 'implementation'),
			])
			expect(implementation).to.equal(newImpl.address)
			expect((await contract.getCounter()).toString()).to.equal('1')
			const eSet = await contract.getEnumerableSet()
			expect(eSet.length).to.equal(2)
			const converted = eSet.map((v) => v.toNumber())
			expect(converted.includes(10)).to.equal(true)
			expect(converted.includes(20)).to.equal(true)
			expect((await contract.testValue()).toString()).to.equal('5')
		})
	})
})
