// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {UsingStorage} from "contracts/src/common/storage/UsingStorage.sol";
import {IMarketGroup} from "contracts/interface/IMarketGroup.sol";

contract MarketGroup is UsingRegistry, UsingStorage, IMarketGroup {
	using SafeMath for uint256;

	constructor(address _registry) public UsingRegistry(_registry) {}

	function addGroup(address _addr) external {
		require(
			msg.sender == registry().registries("MarketFactory"),
			"this is illegal address"
		);

		require(
			eternalStorage().getBool(getGroupKey(_addr)) == false,
			"already enabled"
		);
		eternalStorage().setBool(getGroupKey(_addr), true);
		addCount();
	}

	function isGroup(address _addr) external view returns (bool) {
		return eternalStorage().getBool(getGroupKey(_addr));
	}

	function addCount() private {
		bytes32 key = getCountKey();
		uint256 number = eternalStorage().getUint(key);
		number = number.add(1);
		eternalStorage().setUint(key, number);
	}

	function getCount() external view returns (uint256) {
		bytes32 key = getCountKey();
		return eternalStorage().getUint(key);
	}

	function getCountKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_count"));
	}

	function getGroupKey(address _addr) private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_group", _addr));
	}
}
