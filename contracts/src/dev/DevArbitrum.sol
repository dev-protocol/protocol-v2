// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {Dev} from "contracts/src/dev/Dev.sol";
import {IArbToken} from "contracts/interface/IArbToken.sol";
import {IArbSys} from "contracts/interface/IArbSys.sol";
import {IDevArbitrum} from "contracts/interface/IDevArbitrum.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract DevArbitrum is Dev, IArbToken, IDevArbitrum {
	address public l1Address;
	address public arbSys;
	uint256 public bridgeBalanceOnL1;

	/**
	 * Initialize the passed l1 token and ArbSys address.
	 * The token name is `Dev Arbitrum`, the token symbol is `DEV`, and the decimals is 18.
	 */
	function initialize(address _l1Token, address _arbSys)
		external
		initializer
	{
		__Dev_init("Dev Arbitrum");
		arbSys = _arbSys;
		l1Address = _l1Token;
	}

	function bridgeMint(address _account, uint256 _amount) external override {
		bridgeBalanceOnL1 = bridgeBalanceOnL1 + _amount;
		mint(_account, _amount);
		emit BridgeMint(_account, _amount);
	}

	function bridgeBurn(address _account, uint256 _amount) external override {
		uint256 insufficient = bridgeBalanceOnL1 < _amount
			? _amount - bridgeBalanceOnL1
			: 0;
		burn(_account, _amount);
		emit BridgeBurn(_account, _amount);
		if (insufficient > 0) {
			_mintL1(_account, insufficient);
		}
		uint256 tmp = insufficient > 0 ? bridgeBalanceOnL1 : _amount;
		bridgeBalanceOnL1 = bridgeBalanceOnL1 - tmp;
	}

	function _mintL1(address _to, uint256 _amount) private {
		bytes memory data = abi.encodeWithSignature(
			"escrowMint(uint256)",
			_amount
		);
		// Use Arbitrum's messaging system to execute L1Token.escrowMint
		uint256 id = IArbSys(arbSys).sendTxToL1(_to, data);
		emit TxToL1(address(this), _to, id, data);
		emit L1EscrowMint(l1Address, id, _amount);
	}
}
