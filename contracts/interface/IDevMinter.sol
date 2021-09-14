// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDevMinter {
	function mint(address account, uint256 amount) external returns (bool);

	function renounceMinter() external;
}
