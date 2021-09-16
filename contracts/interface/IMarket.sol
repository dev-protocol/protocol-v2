// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IMarket {
	function initialize(address _registry, address _behavior) external;

	function authenticate(address _prop, string[] memory _args)
		external
		returns (bool);

	function authenticateFromPropertyFactory(
		address _prop,
		address _author,
		string[] memory _args
	) external returns (bool);

	function authenticatedCallback(address _property, bytes32 _idHash)
		external
		returns (address);

	function deauthenticate(address _metrics) external;

	function name() external view returns (string memory);

	function schema() external view returns (string memory);

	function behavior() external view returns (address);

	function issuedMetrics() external view returns (uint256);

	function enabled() external view returns (bool);

	function votingEndTimestamp() external view returns (uint256);

	function toEnable() external;
}
