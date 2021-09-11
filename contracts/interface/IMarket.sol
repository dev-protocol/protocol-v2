// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IMarket {
	function authenticate(
		address _prop,
		string memory _args1,
		string memory _args2,
		string memory _args3,
		string memory _args4,
		string memory _args5
	) external returns (bool);

	function authenticateFromPropertyFactory(
		address _prop,
		address _author,
		string memory _args1,
		string memory _args2,
		string memory _args3,
		string memory _args4,
		string memory _args5
	) external returns (bool);

	function authenticatedCallback(address _property, bytes32 _idHash)
		external
		returns (address);

	function deauthenticate(address _metrics) external;

	function schema() external view returns (string memory);

	function behavior() external view returns (address);

	function issuedMetrics() external view returns (uint256);

	function enabled() external view returns (bool);

	function votingEndTimestamp() external view returns (uint256);

	function toEnable() external;
}
