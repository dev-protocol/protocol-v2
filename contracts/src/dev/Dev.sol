// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

// prettier-ignore
<<<<<<< HEAD
import {ERC20PresetMinterPauser} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
=======
import {ERC20Detailed} from "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
// prettier-ignore
import {ERC20Mintable} from "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
// prettier-ignore
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
>>>>>>> origin/main
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {ILockup} from "contracts/interface/ILockup.sol";
import {IDev} from "contracts/interface/IDev.sol";
import {IMarketGroup} from "contracts/interface/IMarketGroup.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
<<<<<<< HEAD
contract Dev is ERC20PresetMinterPauser, UsingRegistry, IDev {
=======
contract Dev is
	ERC20Detailed,
	ERC20Mintable,
	ERC20Burnable,
	UsingRegistry,
	IDev
{
>>>>>>> origin/main
	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	constructor(address _registry)
		public
<<<<<<< HEAD
		ERC20PresetMinterPauser("Dev", "DEV")
=======
		ERC20Detailed("Dev", "DEV", 18)
>>>>>>> origin/main
		UsingRegistry(_registry)
	{}

	/**
	 * Staking DEV tokens.
	 * The transfer destination must always be included in the address set for Property tokens.
	 * This is because if the transfer destination is not a Property token, it is possible that the staked DEV token cannot be withdrawn.
	 */
	function deposit(address _to, uint256 _amount) external returns (bool) {
		require(transfer(_to, _amount), "dev transfer failed");
		lock(msg.sender, _to, _amount);
		return true;
	}

	/**
	 * Staking DEV tokens by an allowanced address.
	 * The transfer destination must always be included in the address set for Property tokens.
	 * This is because if the transfer destination is not a Property token, it is possible that the staked DEV token cannot be withdrawn.
	 */
	function depositFrom(
		address _from,
		address _to,
		uint256 _amount
	) external returns (bool) {
		require(transferFrom(_from, _to, _amount), "dev transferFrom failed");
		lock(_from, _to, _amount);
		return true;
	}

	/**
	 * Burn the DEV tokens as an authentication fee.
	 * Only Market contracts can execute this function.
	 */
	function fee(address _from, uint256 _amount) external returns (bool) {
		require(
			IMarketGroup(registry().registries("MarketGroup")).isGroup(
				msg.sender
			),
			"this is illegal address"
		);
		_burn(_from, _amount);
		return true;
	}

	/**
	 * Call `Lockup.lockup` to execute staking.
	 */
	function lock(
		address _from,
		address _to,
		uint256 _amount
	) private {
		ILockup(registry().registries("Lockup")).lockup(_from, _to, _amount);
	}
}
