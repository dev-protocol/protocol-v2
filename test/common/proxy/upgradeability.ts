/* eslint-disable @typescript-eslint/no-floating-promises */
import { UpgradeabilityBaseInstance } from '../../../types/truffle-contracts'
import { deployProxy } from '../../test-lib/instance'
import { toBigNumber } from '../../test-lib/utils/common'
import { getEventValue } from '../../test-lib/utils/event'

const random = () => toBigNumber(Math.random()).times(1e32).toFixed()

contract('Upgradeability ', ([deployer, address]) => {
	describe('Same name', () => {
		let contract: UpgradeabilityBaseInstance
		const values = [random(), random(), random()]

		before(async () => {
			contract = await deployProxy(
				artifacts.require('UpgradeabilityBase'),
				deployer
			)
			await contract.initialize()
		})
		it('Store data', async () => {
			await Promise.all([
				contract.setDataUint256(values[0]),
				contract.setDataString(values[1]),
				contract.setDataMapping(address, values[2]),
			])

			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
		it('Should data be upgradable', async () => {
			const newImpl = await artifacts.require('UpgradeabilityBase').new()
			contract.upgradeTo(newImpl.address)
			const [implementation] = await Promise.all([
				getEventValue(contract)('Upgraded', 'implementation'),
			])
			expect(implementation).to.equal(newImpl.address)
			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
	})

	describe('Different contract name', () => {
		let contract: UpgradeabilityBaseInstance
		const values = [random(), random(), random()]

		before(async () => {
			contract = await deployProxy(
				artifacts.require('UpgradeabilityBase'),
				deployer
			)
			await contract.initialize()
		})
		it('Store data', async () => {
			await Promise.all([
				contract.setDataUint256(values[0]),
				contract.setDataString(values[1]),
				contract.setDataMapping(address, values[2]),
			])

			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
		it('Should data be upgradable', async () => {
			const newImpl = await artifacts
				.require('UpgradeabilityDifferentContractName')
				.new()

			contract.upgradeTo(newImpl.address)
			const [implementation] = await Promise.all([
				getEventValue(contract)('Upgraded', 'implementation'),
			])

			expect(implementation).to.equal(newImpl.address)
			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
	})
	describe('Different contract name, different state order', () => {
		let contract: UpgradeabilityBaseInstance
		const values = [random(), random(), random()]

		before(async () => {
			contract = await deployProxy(
				artifacts.require('UpgradeabilityBase'),
				deployer
			)
			await contract.initialize()
		})
		it('Store data', async () => {
			await Promise.all([
				contract.setDataUint256(values[0]),
				contract.setDataString(values[1]),
				contract.setDataMapping(address, values[2]),
			])

			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
		it('Should fail to upgrade data', async () => {
			const newImpl = await artifacts
				.require('UpgradeabilityDifferentContractNameAndOrder')
				.new()

			contract.upgradeTo(newImpl.address)
			const [implementation] = await Promise.all([
				getEventValue(contract)('Upgraded', 'implementation'),
			])

			expect(implementation).to.equal(newImpl.address)
			expect((await contract.dataUint256()).toString()).to.equal('0')
			expect(await contract.dataString()).to.equal('')
			expect((await contract.dataMapping(address)).toString()).to.equal('0')
		})
		it('After revert the order, should data be upgradable', async () => {
			const newImpl = await artifacts
				.require('UpgradeabilityDifferentContractName')
				.new()

			contract.upgradeTo(newImpl.address)
			const [implementation] = await Promise.all([
				getEventValue(contract)('Upgraded', 'implementation'),
			])

			expect(implementation).to.equal(newImpl.address)
			expect((await contract.dataUint256()).toString()).to.equal(values[0])
			expect(await contract.dataString()).to.equal(values[1])
			expect((await contract.dataMapping(address)).toString()).to.equal(
				values[2]
			)
		})
	})
})
