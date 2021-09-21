// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {ERC20PresetMinterPauserUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";
import {InitializableUsingRegistry} from "../../src/common/registry/InitializableUsingRegistry.sol";
import {IDev} from "../../interface/IDev.sol";
import {IMarketFactory} from "../../interface/IMarketFactory.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract Dev is
	ERC20PresetMinterPauserUpgradeable,
	InitializableUsingRegistry,
	IDev
{
	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	function initializeDev(address _registry) external initializer {
		__ERC20PresetMinterPauser_init("Dev", "DEV");
		__UsingRegistry_init(_registry);
	}

	/**
	 * Burn the DEV tokens as an authentication fee.
	 * Only Market contracts can execute this function.
	 */
	function fee(address _from, uint256 _amount)
		external
		override
		returns (bool)
	{
		require(
			IMarketFactory(registry().registries("MarketFactory")).isMarket(
				msg.sender
			),
			"this is illegal address"
		);
		_burn(_from, _amount);
		return true;
	}
}
