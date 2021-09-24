/* eslint-disable @typescript-eslint/no-var-requires */
require('ts-node/register')
require('dotenv').config()
const wrapProvider = require('arb-ethers-web3-bridge').wrapProvider
const HDWalletProvider = require('@truffle/hdwallet-provider')
const { INFURA_KEY, MNEMONIC } = process.env

module.exports = {
	test_file_extension_regexp: /.*\.ts$/,
	contracts_build_directory: './build/arbitrum-contracts',
	compilers: {
		solc: {
			version: '0.8.7',
			settings: {
				optimizer: {
					enabled: true,
					runs: 1500
				},
			},
		},
	},

	networks: {
		arbitrum_local: {
			network_id: '*',
			gas: 8500000,
			provider: function () {
				return new HDWalletProvider({
					mnemonic: {
						phrase: MNEMONIC,
					},
					providerOrUrl: 'http://127.0.0.1:8547/',
					addressIndex: 0,
					numberOfAddresses: 1,
				})
			},
		},
		arbitrum_testnet: {
			network_id: 421611,
			chain_id: 421611,
			gas: 287853530,
			provider: function () {
				return wrapProvider(
					new HDWalletProvider(
						MNEMONIC,
						'https://arbitrum-rinkeby.infura.io/v3/' + INFURA_KEY
					)
				)
			},
		},
		arbitrum_mainnet: {
			network_id: 42161,
			chain_id: 42161,
			provider: function () {
				return new HDWalletProvider(
					MNEMONIC,
					'https://arbitrum-mainnet.infura.io/v3/' + INFURA_KEY,
					0,
					1
				)
			},
		},
	},

	mocha: {
		timeout: 100000,
	},
	db: {
		enabled: false,
	},
}
