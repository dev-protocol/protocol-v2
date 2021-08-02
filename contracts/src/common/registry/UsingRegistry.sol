pragma solidity 0.5.17;

import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

/**
 * Module for using AddressConfig contracts.
 */
contract UsingRegistry {
	address private _registry;

	/**
	 * Initialize the argument as AddressConfig address.
	 */
	constructor(address _addressRegistry) public {
		_registry = _addressRegistry;
	}

	/**
	 * Returns the latest AddressConfig instance.
	 */
	function registry() internal view returns (IAddressRegistry) {
		return IAddressRegistry(_config);
	}

	/**
	 * Returns the AddressRegistry address.
	 */
	function registryAddress() external view returns (address) {
		return _registry;
	}
}
