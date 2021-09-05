// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

// prettier-ignore
<<<<<<< HEAD
import {ERC20PresetMinterPauser} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
=======
import {ERC20Mintable} from "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
>>>>>>> origin/main
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
<<<<<<< HEAD
		ERC20PresetMinterPauser(reg.registries("Dev")).mint(account, amount);
		return true;
=======
		return ERC20Mintable(reg.registries("Dev")).mint(account, amount);
>>>>>>> origin/main
	}

	/**
	 * Delete mint role
	 */
	function renounceMinter() external onlyOwner {
		address token = registry().registries("Dev");
<<<<<<< HEAD
		ERC20PresetMinterPauser dev = ERC20PresetMinterPauser(token);
		dev.renounceRole(dev.MINTER_ROLE(), address(this));
=======
		ERC20Mintable(token).renounceMinter();
>>>>>>> origin/main
	}
}
