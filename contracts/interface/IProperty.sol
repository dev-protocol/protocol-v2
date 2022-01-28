// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IProperty {
	struct PropertyBalance {
		address account;
		uint256 balance;
	}

	event ChangeName(string _old, string _new);
	event ChangeSymbol(string _old, string _new);

	function author() external view returns (address);

	function changeName(string memory _name) external;

	function changeSymbol(string memory _symbol) external;

	function withdraw(address _sender, uint256 _value) external;

	function getBalances() external view returns (PropertyBalance[] memory);
}
