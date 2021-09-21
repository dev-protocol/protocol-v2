// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {PolicyTestBase} from "./PolicyTestBase.sol";

contract PolicyTestForWithdraw is PolicyTestBase {
	function rewards(uint256 _lockups, uint256)
		external
		pure
		override
		returns (uint256)
	{
		return _lockups > 0 ? 100000000000000000000 : 0;
	}
}
