// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

// prettier-ignore
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC20PresetMinterPauser} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";
import {IDevMinter} from "contracts/interface/IDevMinter.sol";

contract DevMinter is
	InitializableUsingRegistry,
	OwnableUpgradeable,
	IDevMinter
{
	function initialize(address _registry) external initializer {
		__Ownable_init();
		__UsingRegistry_init(_registry);
	}

	/**
	 * Mint Dev token
	 */
	function mint(address account, uint256 amount)
		external
		override
		returns (bool)
	{
		IAddressRegistry reg = registry();
		require(
			msg.sender == reg.registries("Lockup") ||
				msg.sender == reg.registries("Withdraw"),
			"illegal access"
		);
		ERC20PresetMinterPauser(reg.registries("Dev")).mint(account, amount);
		return true;
	}

	/**
	 * Delete mint role
	 */
	function renounceMinter() external override onlyOwner {
		address token = registry().registries("Dev");
		ERC20PresetMinterPauser dev = ERC20PresetMinterPauser(token);
		dev.renounceRole(dev.MINTER_ROLE(), address(this));
	}
}
