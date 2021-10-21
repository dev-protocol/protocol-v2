// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IMarketFactory {
	event Create(address indexed _market, address _from);

	function getEnabledMarkets() external view returns (address[] memory);

	function marketsCount() external returns (uint256);

	function create(address _addr) external returns (address);

	function enable(address _addr) external;

	function isMarket(address _addr) external view returns (bool);

	function isPotentialMarket(address _addr) external view returns (bool);
}
