// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "./PolicyTestBase.sol";

contract PolicyTestForPolicyFactory is PolicyTestBase {
	function policyVotingSeconds() external pure override returns (uint256) {
		return 10;
	}
}
