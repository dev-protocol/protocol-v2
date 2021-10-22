// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IL2PropertyFactory {
	event Create(address indexed _from, address _property);

	function create(
		string memory _name,
		string memory _symbol,
		address _author
	) external returns (address);

	function createAndAuthenticate(
		string memory _name,
		string memory _symbol,
		address _market,
		string[] memory _args
	) external returns (bool);

	function isProperty(address _addr) external view returns (bool);
}
