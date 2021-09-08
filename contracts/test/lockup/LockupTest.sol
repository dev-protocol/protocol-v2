// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {Lockup} from "contracts/src/lockup/Lockup.sol";

contract LockupTest is Lockup {
	constructor() Lockup() {}
}

// TODO いらないのでは
