import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { SHARE_OF_TREASURY } from './../const'
import type { DevProtocolInstance } from '../instance'

export async function mine(count: number): Promise<void> {
	for (let i = 0; i < count; i++) {
		// eslint-disable-next-line no-await-in-loop
		await new Promise((resolve) => {
			web3.currentProvider.send(
				{
					jsonrpc: '2.0',
					method: 'evm_mine',
					params: [],
					id: 0,
				},
				resolve,
			)
		})
	}
}

export const forwardBlockTimestamp = async (seconds: number): Promise<void> => {
	await new Promise((resolve) => {
		web3.currentProvider.send(
			{
				jsonrpc: '2.0',
				method: 'evm_increaseTime',
				params: [seconds],
				id: 0,
			},
			resolve,
		)
	})
	return mine(1)
}

export const getBlockTimestamp = async (
	blockNumber?: number,
): Promise<number> =>
	web3.eth
		.getBlock(blockNumber ? blockNumber : await getBlock())
		.then((x: any) => x.timestamp)

export const toBigNumber = (v: string | BigNumber | number): BigNumber =>
	new BigNumber(v)

export const collectsEth =
	(to: string) =>
	async (accounts: Truffle.Accounts, min = 50, rate = 0.5): Promise<void> => {
		const getBalance = async (address: string): Promise<BigNumber> =>
			web3.eth.getBalance(address).then(toBigNumber)
		const web3Client = new Web3(
			new Web3.providers.WebsocketProvider(web3.eth.currentProvider.host),
		)
		const minimum = toBigNumber(Web3.utils.toWei(`${min}`, 'ether'))
		accounts.map(async (account) => {
			const [balance, value] = await Promise.all([
				getBalance(to),
				getBalance(account),
			])
			if (balance.isLessThan(minimum)) {
				await web3Client.eth
					.sendTransaction({
						to,
						from: account,
						value: value.times(rate).toFixed(),
					})
					.catch((err: Error) => err)
			}
		})
	}

export const getBlock = async (): Promise<number> => web3.eth.getBlockNumber()

export function gasLogger(txRes: Truffle.TransactionResponse) {
	console.log(txRes.receipt.gasUsed)
}

export function keccak256(...values: string[]): string {
	return (web3 as Web3).utils.soliditySha3(...values)!
}

export function splitValue(
	_value: BigNumber,
	percentage = SHARE_OF_TREASURY,
): [BigNumber, BigNumber] {
	const tmp = _value.div(new BigNumber(100)).times(new BigNumber(percentage))
	const tmp2 = _value.minus(tmp)
	return [tmp2, tmp]
}

export async function getAmountFromPosition(
	dev: DevProtocolInstance,
	tokenId: number,
): Promise<BigNumber> {
	const position = await dev.sTokensManager.positions(tokenId)
	return toBigNumber(position.amount)
}
