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
		string calldata _args1,
		string calldata _args2,
		string calldata _args3
	) external returns (bool);
}
