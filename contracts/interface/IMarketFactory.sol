// SPDX-License-Identifier: MPL-2.0
pragma solidity = 0.8.6;

interface IMarketFactory {
	function create(address _addr) external returns (address);

	function enable(address _addr) external;
}
