// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

// prettier-ignore
import {ERC20PresetMinterPauser} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {ILockup} from "contracts/interface/ILockup.sol";
import {IDev} from "contracts/interface/IDev.sol";
import {IMarketFactory} from "contracts/interface/IMarketFactory.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract Dev is ERC20PresetMinterPauser, UsingRegistry, IDev {
	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	constructor(address _registry)
		ERC20PresetMinterPauser("Dev", "DEV")
		UsingRegistry(_registry)
	{}

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
