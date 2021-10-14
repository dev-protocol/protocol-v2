// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeabilityLibraryV1 is OwnableUpgradeable, UUPSUpgradeable {
	uint256 public testValue;
	Counters.Counter private tokenIdCounter;
	EnumerableSet.UintSet private enumerableSet;

	using Counters for Counters.Counter;
	using EnumerableSet for EnumerableSet.UintSet;

	function initialize() external initializer {
		__Ownable_init();
		__UUPSUpgradeable_init();
	}

	function upCounter() public {
		tokenIdCounter.increment();
	}

	function getCounter() public view returns (uint256) {
		return tokenIdCounter.current();
	}

	function addEnumerableSet(uint256 _value) public {
		enumerableSet.add(_value);
	}

	function getEnumerableSet() public view returns (uint256[] memory) {
		return enumerableSet.values();
	}

	function setTestValue(uint256 _value) public {
		testValue = _value;
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
