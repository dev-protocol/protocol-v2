// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IPropertyGroup {
	function addGroup(address _addr) external;

	function isGroup(address _addr) external view returns (bool);
}
