pragma solidity 0.5.17;

// prettier-ignore
import {ERC20Mintable} from "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
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
			msg.sender == reg.registries("Lockup") || msg.sender == reg.registries("Withdraw"),
			"illegal access"
		);
		return ERC20Mintable(reg.registries("Dev")).mint(account, amount);
	}

	/**
	 * Delete mint role
	 */
	function renounceMinter() external onlyOwner {
		address token = registry().registries("Dev");
		ERC20Mintable(token).renounceMinter();
	}
}
