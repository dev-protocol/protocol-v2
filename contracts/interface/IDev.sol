// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDev {
	// solhint-disable-next-line func-name-mixedcase
	function MINTER_ROLE() external returns (bytes32);

	// solhint-disable-next-line func-name-mixedcase
	function BURNER_ROLE() external returns (bytes32);

	function mint(address _account, uint256 _amount) external;

	function burn(address _account, uint256 _amount) external;
}
