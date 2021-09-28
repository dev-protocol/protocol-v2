// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.8;

import {PolicyTestBase} from "contracts/test/policy/PolicyTestBase.sol";

contract PolicyTestForProperty is PolicyTestBase {
	function rewards(uint256 _lockups, uint256 _assets)
		external
		pure
		override
		returns (uint256)
	{
		return _assets > 0 ? _lockups : 0;
	}
}
