// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IMarketFactory {
	event Create(address indexed _from, address _market);

	function marketsCount() external returns (uint256);

	function create(address _addr) external returns (address);

	function enable(address _addr) external;

	function isMarket(address _addr) external view returns (bool);

	function isPotentialMarket(address _addr) external view returns (bool);
}
