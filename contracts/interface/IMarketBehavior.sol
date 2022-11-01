// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IMarketBehavior {
	function authenticate(address _prop, string[] memory _args, address account)
		external
		returns (bool);

	function setAssociatedMarket(address _market) external;

	function associatedMarket() external view returns (address);

	function name() external view returns (string memory);

	function schema() external view returns (string memory);

	function getId(address _metrics) external view returns (string memory);

	function getMetrics(string memory _id) external view returns (address);
}
