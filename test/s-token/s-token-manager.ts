/* eslint-disable @typescript-eslint/no-floating-promises */
import BigNumber from 'bignumber.js'
import { DevProtocolInstance } from '../test-lib/instance'
import { PropertyInstance } from '../../types/truffle-contracts'
import { getPropertyAddress } from '../test-lib/utils/log'
import {
	validateErrorMessage,
	validateVmExceptionErrorMessage,
} from '../test-lib/utils/error'
import { getEventValue } from '../test-lib/utils/event'
import { DEFAULT_ADDRESS } from '../test-lib/const'
import { mine } from '../test-lib/utils/common'

contract('STokensManager', ([deployer, user]) => {
	const deployerBalance = new BigNumber(1e18).times(10000000)
	const init = async (): Promise<[DevProtocolInstance, PropertyInstance]> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevMinter()
		await dev.generateSTokensManager()
		await Promise.all([
			dev.generateMarketFactory(),
			dev.generateMetricsFactory(),
			dev.generateLockup(),
			dev.generateWithdraw(),
			dev.generatePropertyFactory(),
			dev.generatePolicyFactory(),
		])
		await dev.dev.mint(deployer, deployerBalance)
		await dev.dev.approve(dev.lockup.address, '100000')
		await dev.generatePolicy('PolicyTestBase')
		const propertyAddress = getPropertyAddress(
			await dev.propertyFactory.create('test', 'TEST', user, {
				from: user,
			})
		)
		const [property] = await Promise.all([
			artifacts.require('Property').at(propertyAddress),
		])

		await dev.metricsFactory.__addMetrics(
			(
				await dev.createMetrics(deployer, property.address)
			).address
		)

		await dev.lockup.update()

		return [dev, property]
	}

	const checkTokenUri = (
		tokenUri: string,
		property: string,
		amount: number,
		cumulativeReward: number
	): void => {
		const uriInfo = tokenUri.split(',')
		expect(uriInfo.length).to.equal(2)
		expect(uriInfo[0]).to.equal('data:application/json;base64')
		const decodedData = Buffer.from(uriInfo[1], 'base64').toString()
		const details = JSON.parse(decodedData)
		const { name, description, image } = details
		checkName(name, property, amount, cumulativeReward)
		checkDescription(description, property)
		checkImage(image, property)
	}

	const checkName = (
		name: string,
		property: string,
		amount: number,
		cumulativeReward: number
	): void => {
		expect(name).to.equal(
			`Dev Protocol sTokens - ${property} - ${amount} DEV - ${cumulativeReward}`
		)
	}

	const checkDescription = (description: string, property: string): void => {
		const testDescription =
			'This NFT represents a staking position in a Dev Protocol Property tokens. The owner of this NFT can modify or redeem the position.\n' +
			`Property Address: ${property}\n\n` +
			'⚠ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as token symbols may be imitated.'
		expect(description).to.equal(testDescription)
	}

	const checkImage = (image: string, property: string): void => {
		const imageInfo = image.split(',')
		expect(imageInfo.length).to.equal(2)
		expect(imageInfo[0]).to.equal('data:image/svg+xml;base64')
		const testImage = `<svg xmlns="http://www.w3.org/2000/svg" width="290" height="500" viewBox="0 0 290 500" fill="none"><rect width="290" height="500" fill="url(#paint0_linear)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M192 203H168.5V226.5V250H145H121.5V226.5V203H98H74.5V226.5V250V273.5H51V297H74.5H98V273.5H121.5H145H168.5H192V250V226.5H215.5H239V203H215.5H192Z" fill="white"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="monospace" font-size="11" letter-spacing="0em"><tspan x="27.4072" y="333.418">${property}</tspan></text><defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="290" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#00D0FD"/><stop offset="0.151042" stop-color="#4889F5"/><stop offset="0.552083" stop-color="#D500E6"/><stop offset="1" stop-color="#FF3815"/></linearGradient></defs></svg>`
		expect(imageInfo[1]).to.equal(testImage)
	}

	describe('STokensManager; initialize', () => {
		it('The initialize function can only be executed once.', async () => {
			const [dev] = await init()
			const result = await dev.sTokensManager
				.initialize(dev.addressRegistry.address)
				.catch((err: Error) => err)
			validateErrorMessage(
				result,
				'Initializable: contract is already initialized'
			)
		})
	})
	describe('name', () => {
		it('get token name', async () => {
			const [dev] = await init()
			const name = await dev.sTokensManager.name()
			expect(name).to.equal('Dev Protocol sTokens V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [dev] = await init()
			const symbol = await dev.sTokensManager.symbol()
			expect(symbol).to.equal('DEV-STOKENS-V1')
		})
	})
	describe('tokenURI', () => {
		describe('success', () => {
			it('get token uri', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const uri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(uri, property.address, 10000, 0)
			})
		})
		describe('fail', () => {
			it('can not get token symbol', async () => {
				const [dev] = await init()
				const res = await dev.sTokensManager
					.tokenURI(1)
					.catch((err: Error) => err)
				validateVmExceptionErrorMessage(res, false)
			})
		})
	})
	describe('mint', () => {
		describe('success', () => {
			it('mint nft', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenId = await dev.sTokensManager.balanceOf(deployer)
				expect(tokenId.toString()).to.equal('1')
				const owner = await dev.sTokensManager.ownerOf(1)
				expect(owner).to.equal(deployer)
			})
			it('generate minted event', async () => {
				const [dev, property] = await init()
				dev.lockup.depositToProperty(property.address, '10000')
				const [_tokenId, _owner, _property, _amount, _price] =
					await Promise.all([
						getEventValue(dev.sTokensManager)('Minted', 'tokenId'),
						getEventValue(dev.sTokensManager)('Minted', 'owner'),
						getEventValue(dev.sTokensManager)('Minted', 'property'),
						getEventValue(dev.sTokensManager)('Minted', 'amount'),
						getEventValue(dev.sTokensManager)('Minted', 'price'),
					])
				expect(_tokenId).to.equal('1')
				expect(_owner).to.equal(deployer)
				expect(_property).to.equal(property.address)
				expect(_amount).to.equal('10000')
				expect(_price).to.equal('0')
			})
			it('generate event', async () => {
				const [dev, property] = await init()
				dev.lockup.depositToProperty(property.address, '10000')
				const [from, to, tokenId] = await Promise.all([
					getEventValue(dev.sTokensManager)('Transfer', 'from'),
					getEventValue(dev.sTokensManager)('Transfer', 'to'),
					getEventValue(dev.sTokensManager)('Transfer', 'tokenId'),
				])
				expect(from).to.equal(DEFAULT_ADDRESS)
				expect(to).to.equal(deployer)
				expect(tokenId).to.equal('1')
			})
			it('The counter will be incremented.', async () => {
				const [dev, property] = await init()
				dev.lockup.depositToProperty(property.address, '10000')
				const [_tokenId] = await Promise.all([
					getEventValue(dev.sTokensManager)('Minted', 'tokenId'),
				])
				expect(_tokenId).to.equal('1')
				dev.lockup.depositToProperty(property.address, '10000')
				const [_tokenId2] = await Promise.all([
					getEventValue(dev.sTokensManager)('Minted', 'tokenId'),
				])
				expect(_tokenId2).to.equal('2')
			})
		})
		describe('fail', () => {
			it('If the owner runs it, an error will occur.', async () => {
				const [dev, property] = await init()
				const res = await dev.sTokensManager
					.mint(deployer, property.address, 100, 10)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
		})
	})
	describe('update', () => {
		describe('success', () => {
			it('update data', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const latestTokenId = 1
				const beforePosition = await dev.sTokensManager.positions(latestTokenId)
				// Console.log(beforePosition)
				expect(beforePosition[0]).to.equal(property.address)
				expect(beforePosition[1].toNumber()).to.equal(10000)
				expect(beforePosition[2].toNumber()).to.equal(0)
				expect(beforePosition[3].toNumber()).to.equal(0)
				expect(beforePosition[4].toNumber()).to.equal(0)
				await dev.lockup.depositToPosition(latestTokenId, '10000')
				const afterPosition = await dev.sTokensManager.positions(latestTokenId)
				// Console.log(afterPosition)
				expect(afterPosition[0]).to.equal(property.address)
				expect(afterPosition[1].toNumber()).to.equal(20000)
				expect(afterPosition[2].toString()).to.equal(
					'1000000000000000000000000000000000'
				)
				expect(afterPosition[3].toString()).to.equal('10000000000000000000')
				expect(afterPosition[4].toString()).to.equal('10000000000000000000')
			})

			it('generate updated event data', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const latestTokenId = 1
				dev.lockup.depositToPosition(latestTokenId, '10000')
				const [_tokenId, _amount, _price, _cumulativeReward, _pendingReward] =
					await Promise.all([
						getEventValue(dev.sTokensManager)('Updated', 'tokenId'),
						getEventValue(dev.sTokensManager)('Updated', 'amount'),
						getEventValue(dev.sTokensManager)('Updated', 'price'),
						getEventValue(dev.sTokensManager)('Updated', 'cumulativeReward'),
						getEventValue(dev.sTokensManager)('Updated', 'pendingReward'),
					])
				expect(_tokenId).to.equal('1')
				expect(_amount).to.equal('20000')
				expect(_price).to.equal('1000000000000000000000000000000000')
				expect(_cumulativeReward).to.equal('10000000000000000000')
				expect(_pendingReward).to.equal('10000000000000000000')
			})
		})
		describe('fail', () => {
			it('If the owner runs it, an error will occur.', async () => {
				const [dev] = await init()
				const res = await dev.sTokensManager
					.update(1, 1, 1, 1, 1)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access', false)
			})
		})
	})
	describe('position', () => {
		describe('success', () => {
			it('get data', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const position = await dev.sTokensManager.positions(1)
				expect(position[0]).to.equal(property.address)
				expect(position[1].toNumber()).to.equal(10000)
				expect(position[2].toNumber()).to.equal(0)
				expect(position[3].toNumber()).to.equal(0)
				expect(position[4].toNumber()).to.equal(0)
			})
		})
		describe('fail', () => {
			it('deta is not found', async () => {
				const [dev] = await init()
				const res = await dev.sTokensManager
					.positions(12345)
					.catch((err: Error) => err)
				validateVmExceptionErrorMessage(res, false)
			})
		})
	})
	describe('rewards', () => {
		describe('success', () => {
			it('get reward', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				await mine(1)
				const position = await dev.sTokensManager.rewards(1)
				expect(position[0].toString()).to.equal('10000000000000000000')
				expect(position[1].toString()).to.equal('0')
				expect(position[2].toString()).to.equal('10000000000000000000')
			})
			it('get updated reward', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToPosition(1, '10000')
				await mine(1)
				const position = await dev.sTokensManager.rewards(1)
				expect(position[0].toString()).to.equal('30000000000000000000')
				expect(position[1].toString()).to.equal('10000000000000000000')
				expect(position[2].toString()).to.equal('20000000000000000000')
			})
		})
		describe('fail', () => {
			it('deta is not found', async () => {
				const [dev] = await init()
				const res = await dev.sTokensManager
					.rewards(12345)
					.catch((err: Error) => err)
				validateVmExceptionErrorMessage(res, false)
			})
		})
	})
	describe('tokensOfProperty', () => {
		describe('success', () => {
			it('get token id', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.tokensOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
			})
			it('get token by property', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const propertyAddress = getPropertyAddress(
					await dev.propertyFactory.create('test', 'TEST', user, {
						from: user,
					})
				)
				await dev.metricsFactory.__addMetrics(
					(
						await dev.createMetrics(deployer, propertyAddress)
					).address
				)

				await dev.lockup.depositToProperty(propertyAddress, '10000')
				const tokenIds = await dev.sTokensManager.tokensOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
				const tokenIds2 = await dev.sTokensManager.tokensOfProperty(
					propertyAddress
				)
				expect(tokenIds2.length).to.equal(1)
				expect(tokenIds2[0].toNumber()).to.equal(2)
			})
			it('get token list', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')

				const tokenIds = await dev.sTokensManager.tokensOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(2)
				expect(tokenIds[0].toNumber()).to.equal(1)
				expect(tokenIds[1].toNumber()).to.equal(2)
			})
			it('return empty array', async () => {
				const [dev] = await init()
				const tokenIds = await dev.sTokensManager.tokensOfProperty(
					DEFAULT_ADDRESS
				)
				expect(tokenIds.length).to.equal(0)
			})
		})
	})
	describe('tokenOfOwner', () => {
		describe('success', () => {
			it('get token id', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.tokenOfOwner(deployer)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
			})
			it('get token by owners', async () => {
				const [dev, property] = await init()
				await dev.dev.mint(user, deployerBalance)
				await dev.dev.approve(dev.lockup.address, '100000', { from: user })
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000', {
					from: user,
				})
				const tokenIds = await dev.sTokensManager.tokenOfOwner(deployer)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
				const tokenIds2 = await dev.sTokensManager.tokenOfOwner(user)
				expect(tokenIds2.length).to.equal(1)
				expect(tokenIds2[0].toNumber()).to.equal(2)
			})
			it('get token list', async () => {
				const [dev, property] = await init()
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.tokenOfOwner(deployer)
				expect(tokenIds.length).to.equal(2)
				expect(tokenIds[0].toNumber()).to.equal(1)
				expect(tokenIds[1].toNumber()).to.equal(2)
			})
			it('return empty array', async () => {
				const [dev] = await init()
				const tokenIds = await dev.sTokensManager.tokenOfOwner(DEFAULT_ADDRESS)
				expect(tokenIds.length).to.equal(0)
			})
		})
	})
})