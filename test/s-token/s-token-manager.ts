/* eslint-disable max-params */
import { encode } from 'js-base64'
import BigNumber from 'bignumber.js'
import { DevProtocolInstance } from '../test-lib/instance'
import type {
	TokenURIDescriptorTestInstance,
	TokenURIDescriptorCopyTestInstance,
	TokenURIDescriptorLegacyTestInstance,
	PropertyInstance,
} from '../../types/truffle-contracts'
import { getPropertyAddress } from '../test-lib/utils/log'
import {
	validateErrorMessage,
	validateVmExceptionErrorMessage,
} from '../test-lib/utils/error'
import { getEventValue } from '../test-lib/utils/event'
import { DEFAULT_ADDRESS } from '../test-lib/const'
import {
	forwardBlockTimestamp,
	getBlockTimestamp,
	toBigNumber,
} from '../test-lib/utils/common'
import type { Snapshot } from '../test-lib/utils/snapshot'
import { takeSnapshot, revertToSnapshot } from '../test-lib/utils/snapshot'

type Attributes = Array<{
	trait_type: string
	value: string | number
	display_type?: string
}>
type Details = {
	name: string
	description: string
	image: string
	attributes: Attributes
}

contract('STokensManager', ([deployer, user]) => {
	const MAX_UINT256 =
		'115792089237316195423570985008687907853269984665640564039457584007913129639935'
	const deployerBalance = new BigNumber(1e18).times(10000000)
	const init = async (): Promise<
		[
			DevProtocolInstance,
			PropertyInstance,
			TokenURIDescriptorTestInstance,
			TokenURIDescriptorCopyTestInstance,
			TokenURIDescriptorLegacyTestInstance
		]
	> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressRegistry()
		await dev.generateDev()
		await dev.generateDevBridge()
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
		await dev.generateTreasury()
		await dev.setCapSetter()
		await dev.updateCap()
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
		const descriptor = await dev.getTokenUriDescriptor()
		const descriptorCopy = await dev.getTokenUriDescriptorCopy()
		const descriptorLegacy = await dev.getTokenUriDescriptorLegacy()
		return [dev, property, descriptor, descriptorCopy, descriptorLegacy]
	}

	let dev: DevProtocolInstance
	let property: PropertyInstance
	let descriptor: TokenURIDescriptorTestInstance
	let descriptorCopy: TokenURIDescriptorCopyTestInstance
	let descriptorLegacy: TokenURIDescriptorLegacyTestInstance
	let snapshot: Snapshot
	let snapshotId: string

	before(async () => {
		;[dev, property, descriptor, descriptorCopy, descriptorLegacy] =
			await init()
	})

	beforeEach(async () => {
		snapshot = (await takeSnapshot()) as Snapshot
		snapshotId = snapshot.result
	})

	afterEach(async () => {
		await revertToSnapshot(snapshotId)
	})

	const checkTokenUri = (
		tokenUri: string,
		property: string,
		amount: number | string,
		cumulativeReward: number,
		payload: string,
		tokenUriImage = ''
	): void => {
		const uriInfo = tokenUri.split(',')
		expect(uriInfo.length).to.equal(2)
		expect(uriInfo[0]).to.equal('data:application/json;base64')
		const decodedData = Buffer.from(uriInfo[1], 'base64').toString()
		const details = JSON.parse(decodedData) as {
			name: string
			description: string
			image: string
			attributes: Attributes
		}
		const { name, description, image } = details
		checkName(name, property, amount, cumulativeReward)
		checkDescription(description, property)
		checkAttributes(details.attributes, property, amount, payload)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		tokenUriImage === ''
			? checkImage(image, property)
			: checkTokenImageUri(image, tokenUriImage)
	}

	const getdetails = (tokenUri: string): Details => {
		const uriInfo = tokenUri.split(',')
		expect(uriInfo.length).to.equal(2)
		expect(uriInfo[0]).to.equal('data:application/json;base64')
		const decodedData = Buffer.from(uriInfo[1], 'base64').toString()
		const details = JSON.parse(decodedData) as {
			name: string
			description: string
			image: string
			attributes: Attributes
		}
		return details
	}

	const checkName = (
		name: string,
		property: string,
		amount: number | string,
		cumulativeReward: number
	): void => {
		expect(name).to.equal(
			`Dev Protocol sTokens - ${property} - ${toBigNumber(amount)
				.div(1e18)
				.toFixed()} DEV - ${cumulativeReward}`
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
		const encoded = encode(testImage)
		expect(imageInfo[1]).to.equal(encoded)
	}

	const checkTokenImageUri = (image: string, tokenUriImage: string): void => {
		expect(image).to.equal(tokenUriImage)
	}

	const checkAttributes = (
		attributes: Attributes,
		property: string,
		amount: number | string,
		payload: string
	): void => {
		expect(attributes).to.deep.equal([
			{ trait_type: 'Destination', value: property },
			{
				trait_type: 'Locked Amount',
				display_type: 'number',
				value: toBigNumber(amount).div(1e18).toNumber(),
			},
			{
				trait_type: 'Payload',
				value: payload,
			},
		])
	}

	describe('STokensManager; initialize', () => {
		it('The initialize function can only be executed once.', async () => {
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
			const name = await dev.sTokensManager.name()
			expect(name).to.equal('Dev Protocol sTokens V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const symbol = await dev.sTokensManager.symbol()
			expect(symbol).to.equal('DEV-STOKENS-V1')
		})
	})
	describe('tokenURI', () => {
		describe('success', () => {
			it('get token uri', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const uri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(uri, property.address, 10000, 0, '0x')
			})
			it('get token uri with big staked amount', async () => {
				await dev.dev.burn(deployer, await dev.dev.balanceOf(deployer))
				await dev.dev.mint(deployer, MAX_UINT256)
				await dev.dev.approve(dev.lockup.address, MAX_UINT256)

				await dev.lockup.depositToProperty(property.address, MAX_UINT256)
				const uri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(uri, property.address, MAX_UINT256, 0, '0x')
			})
			it('get custom token uri', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'ipfs://IPFS-CID', {
					from: user,
				})
				const uri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(uri, property.address, 10000, 0, '0x', 'ipfs://IPFS-CID')
			})
			it('get descriptor token uri; with custom name & description check', async () => {
				// @ts-ignore
				await dev.lockup.depositToProperty(
					property.address,
					'10000',
					web3.utils.keccak256('ADDITIONAL_BYTES')
				)
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					[web3.utils.keccak256('ADDITIONAL_BYTES')],
					{ from: user }
				)
				const uri = await dev.sTokensManager.tokenURI(1)
				// This checks for default name & description
				checkTokenUri(
					uri,
					property.address,
					10000,
					0,
					web3.utils.keccak256('ADDITIONAL_BYTES'),
					'dummy-string'
				)
				// This checks for custom name & description
				await descriptor._setName('new-name')
				await descriptor._setDescription('new-description')
				const recheckURI = await dev.sTokensManager.tokenURI(1)
				const { name, description } = getdetails(recheckURI)
				expect(name).to.equal('new-name')
				expect(description).to.equal('new-description')
			})
			it('get token uri for legacy descriptors; without custom name & description', async () => {
				// @ts-ignore
				await dev.lockup.depositToProperty(
					property.address,
					'10000',
					web3.utils.keccak256('ADDITIONAL_BYTES')
				)
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptorLegacy.address,
					[web3.utils.keccak256('ADDITIONAL_BYTES')],
					{ from: user }
				)
				const uri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(
					uri,
					property.address,
					10000,
					0,
					web3.utils.keccak256('ADDITIONAL_BYTES'),
					'dummy-string'
				)
			})
		})
		describe('fail', () => {
			it('can not get token symbol', async () => {
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
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenId = await dev.sTokensManager.balanceOf(deployer)
				expect(tokenId.toString()).to.equal('1')
				const owner = await dev.sTokensManager.ownerOf(1)
				expect(owner).to.equal(deployer)
			})
			it('generate minted event', async () => {
				const [devLocal, propertyLocal] = await init()

				devLocal.lockup.depositToProperty(propertyLocal.address, '10000')
				const [_tokenId, _owner, _property, _amount, _price] =
					await Promise.all([
						getEventValue(devLocal.sTokensManager)('Minted', 'tokenId'),
						getEventValue(devLocal.sTokensManager)('Minted', 'owner'),
						getEventValue(devLocal.sTokensManager)('Minted', 'property'),
						getEventValue(devLocal.sTokensManager)('Minted', 'amount'),
						getEventValue(devLocal.sTokensManager)('Minted', 'price'),
					])
				expect(_tokenId).to.equal('1')
				expect(_owner).to.equal(deployer)
				expect(_property).to.equal(propertyLocal.address)
				expect(_amount).to.equal('10000')
				expect(_price).to.equal('0')
			})
			it('generate event', async () => {
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
				const [devLocal, propertyLocal] = await init()
				devLocal.lockup.depositToProperty(propertyLocal.address, '10000')
				const [_tokenId] = await Promise.all([
					getEventValue(devLocal.sTokensManager)('Minted', 'tokenId'),
				])
				expect(_tokenId).to.equal('1')
				devLocal.lockup.depositToProperty(propertyLocal.address, '10000')
				const [_tokenId2] = await Promise.all([
					getEventValue(devLocal.sTokensManager)('Minted', 'tokenId'),
				])
				expect(_tokenId2).to.equal('2')
			})
			it('gives priority to payload based descriptor', async () => {
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					[web3.utils.keccak256('PAYLOAD')],
					{ from: user }
				)
				await (dev.sTokensManager as any).methods[
					'setTokenURIDescriptor(address,address)'
				](property.address, descriptorCopy.address, { from: user })
				await descriptorCopy.__shouldBe(false)
				// @ts-ignore
				await dev.lockup.depositToProperty(
					property.address,
					'10000',
					web3.utils.keccak256('PAYLOAD')
				)
				const latestTokenId = 1
				const position = await dev.sTokensManager.positions(latestTokenId)
				expect(position.property).to.equal(property.address)
				expect(toBigNumber(position.amount).toNumber()).to.equal(10000)
				expect(
					await dev.sTokensManager.descriptorOf(position.property)
				).to.equal(descriptorCopy.address)
				expect(
					await dev.sTokensManager.descriptorOfPropertyByPayload(
						position.property,
						web3.utils.keccak256('PAYLOAD')
					)
				).to.equal(descriptor.address)
				expect(await descriptorCopy.shouldBe()).to.equal(false)
			})
		})
		describe('fail', () => {
			it('If the owner runs it, an error will occur.', async () => {
				const res = await dev.sTokensManager
					.mint(deployer, property.address, 100, 10, '0x')
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
		})
	})
	describe('update', () => {
		describe('success', () => {
			it('update data', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(2)
				const latestTokenId = 1
				const beforePosition = await dev.sTokensManager.positions(latestTokenId)
				expect(beforePosition.property).to.equal(property.address)
				expect(toBigNumber(beforePosition.amount).toNumber()).to.equal(10000)
				expect(toBigNumber(beforePosition.price).toNumber()).to.equal(0)
				expect(
					toBigNumber(beforePosition.cumulativeReward).toNumber()
				).to.equal(0)
				expect(toBigNumber(beforePosition.pendingReward).toNumber()).to.equal(0)
				await dev.lockup.depositToPosition(latestTokenId, '10000')
				const t2 = await getBlockTimestamp()
				const afterPosition = await dev.sTokensManager.positions(latestTokenId)
				expect(afterPosition.property).to.equal(property.address)
				expect(toBigNumber(afterPosition.amount).toNumber()).to.equal(20000)
				expect(toBigNumber(afterPosition.price).toFixed()).to.equal(
					toBigNumber('1000000000000000000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(toBigNumber(afterPosition.cumulativeReward).toFixed()).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(toBigNumber(afterPosition.pendingReward).toFixed()).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
			})

			it('generate updated event data', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(2)
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
				const t2 = await getBlockTimestamp()
				expect(_tokenId).to.equal('1')
				expect(_amount).to.equal('20000')
				expect(_price).to.equal(
					toBigNumber('1000000000000000000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(_cumulativeReward).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(_pendingReward).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
			})
		})
		describe('fail', () => {
			it('If the owner runs it, an error will occur.', async () => {
				const res = await dev.sTokensManager
					.update(1, 1, 1, 1, 1)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access', false)
			})
		})
	})

	describe('setTokenURIImage', () => {
		describe('success', () => {
			it('get data', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'ipfs://IPFS-CID', {
					from: user,
				})
				const tokenUri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(
					tokenUri,
					property.address,
					10000,
					0,
					'0x',
					'ipfs://IPFS-CID'
				)
			})
			it('get overwritten data', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'ipfs://IPFS-CID', {
					from: user,
				})
				await dev.sTokensManager.setTokenURIImage(1, 'ipfs://IPFS-CID2', {
					from: user,
				})
				const tokenUri = await dev.sTokensManager.tokenURI(1)
				checkTokenUri(
					tokenUri,
					property.address,
					10000,
					0,
					'0x',
					'ipfs://IPFS-CID2'
				)
			})
		})
		describe('fail', () => {
			it('not author.', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const res = await dev.sTokensManager
					.setTokenURIImage(1, '')
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
			it('was freezed', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'http://dummy', {
					from: user,
				})
				await dev.sTokensManager.freezeTokenURI(1, { from: user })
				const res = await dev.sTokensManager
					.setTokenURIImage(1, '', { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(res, 'freezed')
			})
		})
	})

	describe('freezeTokenURI', () => {
		describe('success', () => {
			it('data freezed', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'http://dummy', {
					from: user,
				})
				let isFreezed = await dev.sTokensManager.isFreezed(1)
				expect(isFreezed).to.equal(false)
				await dev.sTokensManager.freezeTokenURI(1, { from: user })
				isFreezed = await dev.sTokensManager.isFreezed(1)
				expect(isFreezed).to.equal(true)
				const res = await dev.sTokensManager
					.setTokenURIImage(1, 'http://dummy', { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(res, 'freezed')
			})
			it('generated event', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'http://dummy', {
					from: user,
				})
				dev.sTokensManager.freezeTokenURI(1, { from: user })
				const [_tokenId, _freezingUser] = await Promise.all([
					getEventValue(dev.sTokensManager)('Freezed', 'tokenId'),
					getEventValue(dev.sTokensManager)('Freezed', 'freezingUser'),
				])
				expect(_tokenId).to.equal('1')
				expect(_freezingUser).to.equal(user)
			})
		})
		describe('fail', () => {
			it('not author.', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'http://dummy', {
					from: user,
				})
				const res = await dev.sTokensManager
					.freezeTokenURI(1)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
			it('no uri data.', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const res = await dev.sTokensManager
					.freezeTokenURI(1, { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(res, 'no data')
			})
			it('already freezed.', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.setTokenURIImage(1, 'http://dummy', {
					from: user,
				})
				await dev.sTokensManager.freezeTokenURI(1, { from: user })
				const res = await dev.sTokensManager
					.freezeTokenURI(1, { from: user })
					.catch((err: Error) => err)
				validateErrorMessage(res, 'already freezed')
			})
		})
	})

	describe('position', () => {
		describe('success', () => {
			it('get data', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const position = await dev.sTokensManager.positions(1)
				expect(position.property).to.equal(property.address)
				expect(toBigNumber(position.amount).toNumber()).to.equal(10000)
				expect(toBigNumber(position.price).toNumber()).to.equal(0)
				expect(toBigNumber(position.cumulativeReward).toNumber()).to.equal(0)
				expect(toBigNumber(position.pendingReward).toNumber()).to.equal(0)
			})
		})
		describe('fail', () => {
			it('deta is not found', async () => {
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
				await dev.lockup.depositToProperty(property.address, '10000')
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const position = await dev.sTokensManager.rewards(1)
				const t2 = await getBlockTimestamp()
				expect(position.entireReward.toString()).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				expect(position.cumulativeReward.toString()).to.equal('0')
				const tmp =
					await dev.lockup.calculateWithdrawableInterestAmountByPosition(1)
				expect(position.withdrawableReward.toString()).to.equal(
					toBigNumber(tmp).toFixed()
				)
			})
			it('get updated reward', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const t1 = await getBlockTimestamp()
				await forwardBlockTimestamp(1)
				const t2 = await getBlockTimestamp()
				await dev.lockup.depositToPosition(1, '10000')
				await forwardBlockTimestamp(2)
				const position = await dev.sTokensManager.rewards(1)
				expect(position.entireReward.toString()).to.equal(
					toBigNumber(position.cumulativeReward.toString())
						.plus(position.withdrawableReward.toString())
						.toFixed()
				)
				expect(position.cumulativeReward.toString()).to.equal(
					toBigNumber('10000000000000000000')
						.times(t2 - t1)
						.toFixed()
				)
				const tmp =
					await dev.lockup.calculateWithdrawableInterestAmountByPosition(1)
				expect(position.withdrawableReward.toString()).to.equal(
					toBigNumber(tmp).toFixed()
				)
			})
		})
		describe('fail', () => {
			it('deta is not found', async () => {
				const res = await dev.sTokensManager
					.rewards(12345)
					.catch((err: Error) => err)
				validateVmExceptionErrorMessage(res, false)
			})
		})
	})
	describe('positionsOfProperty', () => {
		describe('success', () => {
			it('get token id', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.positionsOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
			})
			it('get token by property', async () => {
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
				const tokenIds = await dev.sTokensManager.positionsOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
				const tokenIds2 = await dev.sTokensManager.positionsOfProperty(
					propertyAddress
				)
				expect(tokenIds2.length).to.equal(1)
				expect(tokenIds2[0].toNumber()).to.equal(2)
			})
			it('get token list', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')

				const tokenIds = await dev.sTokensManager.positionsOfProperty(
					property.address
				)
				expect(tokenIds.length).to.equal(2)
				expect(tokenIds[0].toNumber()).to.equal(1)
				expect(tokenIds[1].toNumber()).to.equal(2)
			})
			it('return empty array', async () => {
				const tokenIds = await dev.sTokensManager.positionsOfProperty(
					DEFAULT_ADDRESS
				)
				expect(tokenIds.length).to.equal(0)
			})
		})
	})
	describe('positionsOfOwner', () => {
		describe('success', () => {
			it('get token id', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
			})
			it('get token by owners', async () => {
				await dev.dev.mint(user, deployerBalance)
				await dev.dev.approve(dev.lockup.address, '100000', { from: user })
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000', {
					from: user,
				})
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(1)
				expect(tokenIds[0].toNumber()).to.equal(1)
				const tokenIds2 = await dev.sTokensManager.positionsOfOwner(user)
				expect(tokenIds2.length).to.equal(1)
				expect(tokenIds2[0].toNumber()).to.equal(2)
			})
			it('get token list', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(2)
				expect(tokenIds[0].toNumber()).to.equal(1)
				expect(tokenIds[1].toNumber()).to.equal(2)
			})
			it('return empty array', async () => {
				const tokenIds = await dev.sTokensManager.positionsOfOwner(
					DEFAULT_ADDRESS
				)
				expect(tokenIds.length).to.equal(0)
			})
			it('transfer token(index0)', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.transferFrom(deployer, user, 1)
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(2)
				const tmpIds = tokenIds.map((value) => value.toNumber())
				tmpIds.sort((first, second) => first - second)
				expect(tmpIds[0]).to.equal(2)
				expect(tmpIds[1]).to.equal(3)
				const tokenIdsUser = await dev.sTokensManager.positionsOfOwner(user)
				expect(tokenIdsUser.length).to.equal(1)
				expect(tokenIdsUser[0].toNumber()).to.equal(1)
			})
			it('transfer token(index1)', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.transferFrom(deployer, user, 2)
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(2)
				const tmpIds = tokenIds.map((value) => value.toNumber())
				tmpIds.sort((first, second) => first - second)
				expect(tmpIds[0]).to.equal(1)
				expect(tmpIds[1]).to.equal(3)
				const tokenIdsUser = await dev.sTokensManager.positionsOfOwner(user)
				expect(tokenIdsUser.length).to.equal(1)
				expect(tokenIdsUser[0].toNumber()).to.equal(2)
			})
			it('transfer token(index2)', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.lockup.depositToProperty(property.address, '10000')
				await dev.sTokensManager.transferFrom(deployer, user, 3)
				const tokenIds = await dev.sTokensManager.positionsOfOwner(deployer)
				expect(tokenIds.length).to.equal(2)
				const tmpIds = tokenIds.map((value) => value.toNumber())
				tmpIds.sort((first, second) => first - second)
				expect(tmpIds[0]).to.equal(1)
				expect(tmpIds[1]).to.equal(2)
				const tokenIdsUser = await dev.sTokensManager.positionsOfOwner(user)
				expect(tokenIdsUser.length).to.equal(1)
				expect(tokenIdsUser[0].toNumber()).to.equal(3)
			})
		})
	})

	describe('setTokenURIDescriptor: with payload', () => {
		describe('success', () => {
			const payload1: string[] = [web3.utils.keccak256('FIRST_PAYLOAD')]
			const payload2: string[] = [web3.utils.keccak256('SECOND_PAYLOAD')]
			it('set descriptor address', async () => {
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					payload1,
					{ from: user }
				)
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					payload2,
					{ from: user }
				)
				const tmp = await dev.sTokensManager.descriptorOfPropertyByPayload(
					property.address,
					payload1[0]
				)
				const tmp2 = await dev.sTokensManager.descriptorOfPropertyByPayload(
					property.address,
					payload2[0]
				)
				expect(tmp).to.equal(descriptor.address)
				expect(tmp2).to.equal(descriptor.address)
			})
			it('stores the passed payload', async () => {
				const payload: string[] = [web3.utils.keccak256('ADDITIONAL_BYTES')]
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					payload,
					{ from: user }
				)
				// @ts-ignore
				await dev.lockup.depositToProperty(
					property.address,
					'10000',
					web3.utils.keccak256('ADDITIONAL_BYTES')
				)
				const key = await descriptor.dataOf(1)
				expect(key).to.equal(web3.utils.keccak256('ADDITIONAL_BYTES'))
			})
		})
		describe('fail', () => {
			it('illegal property', async () => {
				const payload: string[] = [web3.utils.keccak256('ADDITIONAL_BYTES')]
				const res = await dev.sTokensManager
					.setTokenURIDescriptor(property.address, descriptor.address, payload)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
			it('revert on onBeforeMint', async () => {
				const payload: string[] = [web3.utils.keccak256('ADDITIONAL_BYTES')]
				await dev.sTokensManager.setTokenURIDescriptor(
					property.address,
					descriptor.address,
					payload,
					{ from: user }
				)
				await descriptor.__shouldBe(false)
				// @ts-ignore
				const res = await dev.lockup
					.depositToProperty(
						property.address,
						'10000',
						web3.utils.keccak256('ADDITIONAL_BYTES')
					)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'failed to call onBeforeMint')
			})
		})
	})

	describe('setTokenURIDescriptor: without payload', () => {
		describe('success', () => {
			it('set descriptor address', async () => {
				await (dev.sTokensManager as any).methods[
					'setTokenURIDescriptor(address,address)'
				](property.address, descriptor.address, { from: user })
				const tmp = await dev.sTokensManager.descriptorOf(property.address)
				expect(tmp).to.equal(descriptor.address)
			})
			it('stores the passed payload', async () => {
				await (dev.sTokensManager as any).methods[
					'setTokenURIDescriptor(address,address)'
				](property.address, descriptor.address, { from: user })
				// @ts-ignore
				await dev.lockup.depositToProperty(
					property.address,
					'10000',
					web3.utils.keccak256('ADDITIONAL_BYTES')
				)
				const key = await descriptor.dataOf(1)
				expect(key).to.equal(web3.utils.keccak256('ADDITIONAL_BYTES'))
			})
		})
		describe('fail', () => {
			it('illegal property', async () => {
				const res = await (dev.sTokensManager as any).methods[
					'setTokenURIDescriptor(address,address)'
				](property.address, descriptor.address).catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access')
			})
			it('revert on onBeforeMint', async () => {
				await (dev.sTokensManager as any).methods[
					'setTokenURIDescriptor(address,address)'
				](property.address, descriptor.address, { from: user })
				await descriptor.__shouldBe(false)
				// @ts-ignore
				const res = await dev.lockup
					.depositToProperty(
						property.address,
						'10000',
						web3.utils.keccak256('ADDITIONAL_BYTES')
					)
					.catch((err: Error) => err)
				validateErrorMessage(res, 'failed to call onBeforeMint')
			})
		})
	})

	describe('currentIndex', () => {
		describe('success', () => {
			it('get initial token id number', async () => {
				const tmp = await dev.sTokensManager.currentIndex()
				expect(tmp.toString()).to.equal('0')
			})
			it('get currentIndex token id number', async () => {
				await dev.lockup.depositToProperty(property.address, '10000')
				const tmp = await dev.sTokensManager.currentIndex()
				expect(tmp.toString()).to.equal('1')
			})
		})
	})

	describe('tokenURISim', () => {
		const generateParams = (): [any, any] => {
			const positions = {
				property: property.address,
				amount: 10,
				price: 100,
				cumulativeReward: 1000,
				pendingReward: 10000,
			}
			const reward = {
				entireReward: 100,
				cumulativeReward: 1000,
				withdrawableReward: 10000,
			}
			return [positions, reward]
		}

		it('default token uri', async () => {
			const [positions, rewards] = generateParams()
			const tmp = await dev.sTokensManager.tokenURISim(
				1,
				DEFAULT_ADDRESS,
				positions,
				rewards,
				'0x'
			)
			checkTokenUri(
				tmp,
				positions.property,
				positions.amount,
				positions.cumulativeReward,
				'0x'
			)
		})
		it('set token uri image', async () => {
			await dev.lockup.depositToProperty(property.address, '10000')
			await dev.sTokensManager.setTokenURIImage(1, 'ipfs://IPFS-CID', {
				from: user,
			})
			const [positions, rewards] = generateParams()
			const tokenUri = await dev.sTokensManager.tokenURISim(
				1,
				DEFAULT_ADDRESS,
				positions,
				rewards,
				'0x'
			)
			checkTokenUri(
				tokenUri,
				positions.property,
				positions.amount,
				positions.cumulativeReward,
				'0x',
				'ipfs://IPFS-CID'
			)
		})
		it('default descriptor: with payload', async () => {
			const [positions, rewards] = generateParams()
			const payload: string[] = [web3.utils.keccak256('PAYLOAD')]
			await dev.sTokensManager.setTokenURIDescriptor(
				property.address,
				descriptor.address,
				payload,
				{ from: user }
			)
			const tmp = await dev.sTokensManager.tokenURISim(
				1,
				DEFAULT_ADDRESS,
				positions,
				rewards,
				web3.utils.keccak256('PAYLOAD')
			)
			checkTokenUri(
				tmp,
				positions.property,
				positions.amount,
				positions.cumulativeReward,
				'0x',
				'dummy-string'
			)
		})
		it('default descriptor: without payload', async () => {
			const [positions, rewards] = generateParams()
			await (dev.sTokensManager as any).methods[
				'setTokenURIDescriptor(address,address)'
			](property.address, descriptor.address, { from: user })
			const tmp = await dev.sTokensManager.tokenURISim(
				1,
				DEFAULT_ADDRESS,
				positions,
				rewards,
				'0x'
			)
			checkTokenUri(
				tmp,
				positions.property,
				positions.amount,
				positions.cumulativeReward,
				'0x',
				'dummy-string'
			)
		})
	})

	describe('totalSupply', () => {
		it('initial value is 0', async () => {
			const totalSupply = await dev.sTokensManager.totalSupply()
			expect(totalSupply.toString()).to.equal('0')
		})
		it('increace totalSupply after minted', async () => {
			await dev.lockup.depositToProperty(property.address, '1')
			const totalSupply1 = await dev.sTokensManager.totalSupply()
			expect(totalSupply1.toString()).to.equal('1')

			await dev.lockup.depositToProperty(property.address, '2')
			const totalSupply2 = await dev.sTokensManager.totalSupply()
			expect(totalSupply2.toString()).to.equal('2')
		})
	})
	describe('tokenOfOwnerByIndex', () => {
		describe('success', () => {
			it('increace tokenOfOwnerByIndex after minted', async () => {
				await dev.lockup.depositToProperty(property.address, '1')
				const tokenOfOwnerByIndex1 =
					await dev.sTokensManager.tokenOfOwnerByIndex(deployer, 0)
				expect(tokenOfOwnerByIndex1.toString()).to.equal('1')

				await dev.lockup.depositToProperty(property.address, '1')
				const tokenOfOwnerByIndex2 =
					await dev.sTokensManager.tokenOfOwnerByIndex(deployer, 1)
				expect(tokenOfOwnerByIndex2.toString()).to.equal('2')
			})
			it('[multiple persons] increace tokenOfOwnerByIndex after minted', async () => {
				await dev.lockup.depositToProperty(property.address, '1')
				await dev.lockup.depositToProperty(property.address, '1')
				const tokenOfOwnerByIndex1 =
					await dev.sTokensManager.tokenOfOwnerByIndex(deployer, 1)
				expect(tokenOfOwnerByIndex1.toString()).to.equal('2')

				await dev.dev.mint(user, deployerBalance)
				await dev.dev.approve(dev.lockup.address, '100000', { from: user })

				await dev.lockup.depositToProperty(property.address, '1', {
					from: user,
				})
				const tokenOfOwnerByIndex2 =
					await dev.sTokensManager.tokenOfOwnerByIndex(user, 0)
				expect(tokenOfOwnerByIndex2.toString()).to.equal('3')
			})
		})
		describe('fail', () => {
			it('throws the error when the passed index is over than the holding index', async () => {
				const res = await dev.sTokensManager
					.tokenOfOwnerByIndex(deployer, 0)
					.catch((err: Error) => err)
				validateErrorMessage(
					res,
					'ERC721Enumerable: owner index out of bounds',
					false
				)
			})
			it('[after minted] throws the error when the passed index is over than the holding index', async () => {
				await dev.lockup.depositToProperty(property.address, '1')

				const res = await dev.sTokensManager
					.tokenOfOwnerByIndex(deployer, 1)
					.catch((err: Error) => err)
				validateErrorMessage(
					res,
					'ERC721Enumerable: owner index out of bounds',
					false
				)
			})
		})
	})
	describe('tokenByIndex', () => {
		describe('success', () => {
			it('increace tokenByIndex after minted', async () => {
				await dev.lockup.depositToProperty(property.address, '1')
				const tokenByIndex1 = await dev.sTokensManager.tokenByIndex(0)
				expect(tokenByIndex1.toString()).to.equal('1')

				await dev.lockup.depositToProperty(property.address, '1')
				const tokenByIndex2 = await dev.sTokensManager.tokenByIndex(1)
				expect(tokenByIndex2.toString()).to.equal('2')
			})
		})
		describe('fail', () => {
			it('throws the error when the passed index is over than the minted amount', async () => {
				const res = await dev.sTokensManager
					.tokenByIndex('0')
					.catch((err: Error) => err)

				validateErrorMessage(
					res,
					'ERC721Enumerable: global index out of bounds',
					false
				)
			})
			it('[after minted] throws the error when the passed index is over than the minted amount', async () => {
				await dev.lockup.depositToProperty(property.address, '1')

				const res = await dev.sTokensManager
					.tokenByIndex('1')
					.catch((err: Error) => err)

				validateErrorMessage(
					res,
					'ERC721Enumerable: global index out of bounds',
					false
				)
			})
		})
	})
	describe('setSTokenRoyaltyForProperty', () => {
		describe('success', () => {
			it('set sToken royalty for property', async () => {
				await dev.sTokensManager.setSTokenRoyaltyForProperty(
					property.address,
					'1000',
					{ from: user }
				)
				const royalty = await dev.sTokensManager.royaltyOf(property.address)
				expect(royalty.toString()).to.equal('1000')
			})
		})
		describe('fail', () => {
			it('not authorized', async () => {
				const res = await dev.sTokensManager
					.setSTokenRoyaltyForProperty(property.address, '1000')
					.catch((err: Error) => err)
				validateErrorMessage(res, 'illegal access', false)
			})
			it('throws the error when the passed royalty is over than 100%', async () => {
				const res = await dev.sTokensManager
					.setSTokenRoyaltyForProperty(property.address, '10001', {
						from: user,
					})
					.catch((err: Error) => err)

				validateErrorMessage(res, 'ERC2981Royalties: Too high', false)
			})
		})

		describe('royaltyInfo', () => {
			describe('success', () => {
				it('get royalty info', async () => {
					await dev.sTokensManager.setSTokenRoyaltyForProperty(
						property.address,
						'1000',
						{ from: user }
					)
					await dev.lockup.depositToProperty(property.address, '10000')
					const royaltyInfo = await dev.sTokensManager.royaltyInfo(1, '100')
					expect(royaltyInfo[0]).to.equal(user)
					expect(royaltyInfo[1].toString()).to.equal('10')
				})
			})
		})
	})
})
