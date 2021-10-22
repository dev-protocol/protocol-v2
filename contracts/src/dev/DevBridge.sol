// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "../../interface/IL2AddressRegistry.sol";
import "../../interface/IL2DevBridge.sol";
import "../../interface/IL2Dev.sol";
import "../../interface/IL2MarketFactory.sol";
import "../common/registry/InitializableUsingRegistry.sol";

contract DevBridge is
	InitializableUsingRegistry,
	OwnableUpgradeable,
	IL2DevBridge
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
		IL2AddressRegistry reg = registry();
		require(
			msg.sender == reg.registries("Lockup") ||
				msg.sender == reg.registries("Withdraw"),
			"illegal access"
		);
		IL2Dev(reg.registries("Dev")).mint(_account, _amount);
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
			IL2MarketFactory(registry().registries("MarketFactory")).isMarket(
				msg.sender
			),
			"illegal access"
		);
		IL2Dev(registry().registries("Dev")).burn(_account, _amount);
		return true;
	}

	/**
	 * Delete mint role
	 */
	function renounceMinter() external override onlyOwner {
		address token = registry().registries("Dev");
		IL2Dev dev = IL2Dev(token);
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
		IL2Dev dev = IL2Dev(token);
		IAccessControlUpgradeable accessControl = IAccessControlUpgradeable(
			token
		);
		accessControl.renounceRole(dev.BURNER_ROLE(), address(this));
	}
}
