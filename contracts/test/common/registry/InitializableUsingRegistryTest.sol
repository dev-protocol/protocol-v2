// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {InitializableUsingRegistry} from "../../../src/common/registry/InitializableUsingRegistry.sol";

/**
 * Module for using AddressRegistry contracts.
 */
contract InitializableUsingRegistryTest is InitializableUsingRegistry {
	constructor() InitializableUsingRegistry() {}

	/* solhint-disable func-name-mixedcase */
	function __UsingRegistry_init_test(address _addressRegistry) external {
		__UsingRegistry_init(_addressRegistry);
	}

	function getToken() external view returns (address) {
		return registry().registries("Dev");
	}
}
