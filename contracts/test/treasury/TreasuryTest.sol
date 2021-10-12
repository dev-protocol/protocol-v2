// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../src/common/registry/InitializableUsingRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../interface/IWithdraw.sol";
import "../../interface/IAddressRegistry.sol";

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
