// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {Dev} from "contracts/src/dev/Dev.sol";
import {IArbToken} from "contracts/interface/IArbToken.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract DevArbitrum is Dev, IArbToken {
	// TODO
	// `l1Address` getter should be returned an address of a deployed https://github.com/dev-protocol/dev-arb-one/blob/main/contracts/Dev.sol

	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */

	address public l1Address;

	function initialize() external initializer {
		this.initialize("Dev Arbitrum");
	}

	function bridgeMint(address account, uint256 amount) external override {
		mint(account, amount);
	}

	function bridgeBurn(address account, uint256 amount) external override {
		burn(account, amount);
	}
}
