// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {PolicyTestBase} from "./PolicyTestBase.sol";

contract PolicyTestForPolicyFactory is PolicyTestBase {
	function policyVotingSeconds() external pure override returns (uint256) {
		return 10;
	}
}
