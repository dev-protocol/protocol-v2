// SPDX-License-Identifier: MPL-2.0
pragma solidity = 0.8.6;

import {PolicyTestBase} from "contracts/test/policy/PolicyTestBase.sol";

contract PolicyTestForWithdraw is PolicyTestBase {
	// solhint-disable-next-line no-unused-vars
	function rewards(uint256 _lockups, uint256 _assets)
		external
		view
		returns (uint256)
	{
		return _lockups > 0 ? 100000000000000000000 : 0;
	}
}
