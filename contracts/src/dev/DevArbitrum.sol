// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/IArbToken.sol";
import "../../interface/IArbSys.sol";
import "../../interface/IDevArbitrum.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./Dev.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract DevArbitrum is
	Dev,
	IArbToken,
	IDevArbitrum,
	InitializableUsingRegistry
{
	uint256 public bridgeBalanceOnL1;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
		__Dev_init("Dev Arbitrum");
	}

	function l1Address() external view override returns (address) {
		return registry().registries("L1DevAddress");
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
			_mintL1(0, insufficient);
		}
		uint256 tmp = insufficient > 0 ? bridgeBalanceOnL1 : _amount;
		bridgeBalanceOnL1 = bridgeBalanceOnL1 - tmp;
	}

	function _mintL1(uint256 _l1CallValue, uint256 _amount) private {
		bytes memory data = abi.encodeWithSignature(
			"escrowMint(uint256)",
			_amount
		);
		// Use Arbitrum's messaging system to execute L1Token.escrowMint
		address arbSys = registry().registries("ArbSys");
		address l1DevAddress = registry().registries("L1DevAddress");
		uint256 id = IArbSys(arbSys).sendTxToL1{value: _l1CallValue}(
			l1DevAddress,
			data
		);
		emit L1EscrowMint(l1DevAddress, id, _amount);
		emit TxToL1(address(this), id, data);
	}
}
