// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IPropertyFactory {
	event Create(address indexed _from, address _property);

	function create(
		string calldata _name,
		string calldata _symbol,
		address _author
	) external returns (address);

	function createAndAuthenticate(
		string calldata _name,
		string calldata _symbol,
		address _market,
		string[] memory _args
	) external returns (bool);

	function isProperty(address _addr) external view returns (bool);
}
