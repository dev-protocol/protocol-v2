// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDev {
	function initialize(address _registry) external;

	function fee(address _from, uint256 _amount) external returns (bool);
}
