// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {IArbSys} from "contracts/interface/IArbSys.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract ArbSysTest is IArbSys {
	Counters.Counter private idCounter;

	using Counters for Counters.Counter;

	function arbOSVersion() external pure returns (uint256) {
		return 0;
	}

	function arbBlockNumber() external view returns (uint256) {
		return 0;
	}

	// solhint-disable-next-line no-unused-vars
	function withdrawEth(address destination)
		external
		payable
		returns (uint256)
	{
		return 0;
	}

	// solhint-disable-next-line no-unused-vars
	function sendTxToL1(address destination, bytes calldata calldataForL1)
		external
		payable
		returns (uint256)
	{
		idCounter.increment();
		return idCounter.current();
	}

	// solhint-disable-next-line no-unused-vars
	function getTransactionCount(address account)
		external
		view
		returns (uint256)
	{
		return 0;
	}

	// solhint-disable-next-line no-unused-vars
	function getStorageAt(address account, uint256 index)
		external
		view
		returns (uint256)
	{
		return 0;
	}

	function isTopLevelCall() external view returns (bool) {
		return true;
	}
}
