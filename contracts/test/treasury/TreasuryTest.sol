// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IWithdraw} from "contracts/interface/IWithdraw.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

contract TreasuryTest is Ownable {
	IAddressRegistry private _registry;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	constructor(address __registry) {
		_registry = IAddressRegistry(__registry);
	}

	function withdraw(address _property) external {
		IWithdraw(_registry.registries("Withdraw")).withdraw(_property);
	}

	function transfer() external onlyOwner returns (bool) {
		IERC20 token = IERC20(_registry.registries("Dev"));
		uint256 balance = token.balanceOf(address(this));
		return token.transfer(msg.sender, balance);
	}
}
