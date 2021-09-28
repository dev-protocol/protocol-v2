// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.8;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IAccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";
import {IDevBridge} from "contracts/interface/IDevBridge.sol";
import {IDev} from "contracts/interface/IDev.sol";
import {IMarketFactory} from "contracts/interface/IMarketFactory.sol";

contract DevBridge is
	InitializableUsingRegistry,
	OwnableUpgradeable,
	IDevBridge
{
	function initialize(address _registry) external initializer {
		__Ownable_init();
		__UsingRegistry_init(_registry);
	}

	/**
	 * Mint Dev token
	 */
	function mint(address _account, uint256 _amount)
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
		IDev(reg.registries("Dev")).mint(_account, _amount);
		return true;
	}

	/**
	 * Burn Dev token
	 */
	function burn(address _account, uint256 _amount)
		external
		override
		returns (bool)
	{
		require(
			IMarketFactory(registry().registries("MarketFactory")).isMarket(
				msg.sender
			),
			"illegal access"
		);
		IDev(registry().registries("Dev")).burn(_account, _amount);
		return true;
	}

	/**
	 * Delete mint role
	 */
	function renounceMinter() external override onlyOwner {
		address token = registry().registries("Dev");
		IDev dev = IDev(token);
		IAccessControlUpgradeable accessControl = IAccessControlUpgradeable(
			token
		);
		accessControl.renounceRole(dev.MINTER_ROLE(), address(this));
	}

	/**
	 * Delete burn role
	 */
	function renounceBurner() external override onlyOwner {
		address token = registry().registries("Dev");
		IDev dev = IDev(token);
		IAccessControlUpgradeable accessControl = IAccessControlUpgradeable(
			token
		);
		accessControl.renounceRole(dev.BURNER_ROLE(), address(this));
	}
}
