// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IDev {
	function fee(address _from, uint256 _amount) external returns (bool);
}
