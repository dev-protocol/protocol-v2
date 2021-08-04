pragma solidity 0.5.17;

import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";


contract UsingRegistryTest is UsingRegistry {
	constructor(address _registry) public UsingRegistry(_registry) {}

	function getToken() external view returns (address) {
		return registry().registries("Dev");
	}
}
