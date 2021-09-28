// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.8;

import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IWithdraw} from "contracts/interface/IWithdraw.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TreasuryTest is OwnableUpgradeable, InitializableUsingRegistry {
	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__Ownable_init();
		__UsingRegistry_init(_registry);
	}

	function withdraw(address _property) external {
		IWithdraw(registry().registries("Withdraw")).withdraw(_property);
	}

	function transfer() external onlyOwner returns (bool) {
		IERC20 token = IERC20(registry().registries("Dev"));
		uint256 balance = token.balanceOf(address(this));
		return token.transfer(msg.sender, balance);
	}
}
