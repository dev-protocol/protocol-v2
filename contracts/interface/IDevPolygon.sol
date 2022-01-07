// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDevPolygon {
	function deposit(address user, bytes calldata depositData) external;

	function withdraw(uint256 amount) external;
}
