// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {PolicyFactory} from "contracts/src/policy/PolicyFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract PolicyFactoryTest is PolicyFactory {
	constructor() PolicyFactory() {}

	function ___addPolicy(address _addr) public {
		_addPolicy(_addr);
	}
}
