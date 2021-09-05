// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {Lockup} from "contracts/src/lockup/Lockup.sol";
import {LockupStorageTest} from "contracts/test/lockup/LockupStorageTest.sol";

contract LockupTest is LockupStorageTest, Lockup {
	constructor(address _registry) Lockup(_registry) {}
}

// TODO いらないのでは
