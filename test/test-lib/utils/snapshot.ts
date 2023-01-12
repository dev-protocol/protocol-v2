import type { HttpProvider } from 'web3-core'

export const takeSnapshot = async () =>
	new Promise((resolve, reject) => {
		;(web3.currentProvider as HttpProvider).send(
			{
				jsonrpc: '2.0',
				method: 'evm_snapshot',
				id: new Date().getTime(),
				params: [],
			},
			(err, snapshotId) => {
				if (err) {
					reject(err)
				}

				resolve(snapshotId)
			}
		)
	})

export const revertToSnapshot = async (id: string) =>
	new Promise((resolve, reject) => {
		;(web3.currentProvider as HttpProvider).send(
			{
				jsonrpc: '2.0',
				method: 'evm_revert',
				params: [id],
				id: new Date().getTime(),
			},
			(err, result) => {
				if (err) {
					reject(err)
				}

				resolve(result)
			}
		)
	})

export type Snapshot = {
	id: number
	jsonrpc: string
	result: string
}
