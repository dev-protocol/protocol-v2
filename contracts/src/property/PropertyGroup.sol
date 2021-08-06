// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {UsingStorage} from "contracts/src/common/storage/UsingStorage.sol";
import {IPropertyGroup} from "contracts/interface/IPropertyGroup.sol";

contract PropertyGroup is UsingRegistry, UsingStorage, IPropertyGroup {
	constructor(address _registry) public UsingRegistry(_registry) {}

	function addGroup(address _addr) external {
		require(
			msg.sender == registry().registries("PropertyFactory"),
			"this is illegal address"
		);

		require(
			eternalStorage().getBool(getGroupKey(_addr)) == false,
			"already enabled"
		);
		eternalStorage().setBool(getGroupKey(_addr), true);
	}

	function isGroup(address _addr) external view returns (bool) {
		return eternalStorage().getBool(getGroupKey(_addr));
	}

	function getGroupKey(address _addr) private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_group", _addr));
	}
}
