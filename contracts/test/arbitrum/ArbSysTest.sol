// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";

contract ArbSysTest {
	Counters.Counter private idCounter;
	address public latestSendTxToL1Arg1;
	bytes public latestSendTxToL1Arg2;

	using Counters for Counters.Counter;

	// solhint-disable-next-line no-unused-vars
	function sendTxToL1(
		address _arg1,
		bytes calldata _arg2
	) external payable returns (uint256) {
		latestSendTxToL1Arg1 = _arg1;
		latestSendTxToL1Arg2 = _arg2;
		idCounter.increment();
		return idCounter.current();
	}

	function isTopLevelCall() external pure returns (bool) {
		return true;
	}
}
