// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeabilityDifferentContractNameAndOrder is
	OwnableUpgradeable,
	UUPSUpgradeable
{
	string public dataString;
	mapping(address => uint256) public dataMapping;
	uint256 public dataUint256;

	function initialize() external initializer {
		__Ownable_init();
		__UUPSUpgradeable_init();
	}

	function setDataUint256(uint256 _d) public {
		dataUint256 = _d;
	}

	function setDataString(string memory _d) public {
		dataString = _d;
	}

	function setDataMapping(address _a, uint256 _d) public {
		dataMapping[_a] = _d;
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
