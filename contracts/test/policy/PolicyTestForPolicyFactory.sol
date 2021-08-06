// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {PolicyTestBase} from "contracts/test/policy/PolicyTestBase.sol";

contract PolicyTestForPolicyFactory is PolicyTestBase {
	function policyVotingBlocks() external view returns (uint256) {
		return 10;
	}
}
