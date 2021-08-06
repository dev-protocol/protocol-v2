// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

// prettier-ignore
import {ERC20PresetMinterPauser} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";
import {IDevMinter} from "contracts/interface/IDevMinter.sol";

contract DevMinter is UsingRegistry, Ownable, IDevMinter {
	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	constructor(address _registry) public UsingRegistry(_registry) {}

	/**
	 * Mint Dev token
	 */
	function mint(address account, uint256 amount) external returns (bool) {
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
	function renounceMinter() external onlyOwner {
		address token = registry().registries("Dev");
		ERC20PresetMinterPauser dev = ERC20PresetMinterPauser(token);
		dev.renounceRole(dev.MINTER_ROLE(), address(this));
	}
}
