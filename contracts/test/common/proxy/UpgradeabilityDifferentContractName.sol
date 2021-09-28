// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.8;

contract UpgradeabilityDifferentContractName {
	uint256 public dataUint256;
	string public dataString;
	mapping(address => uint256) public dataMapping;

	function setDataUint256(uint256 _d) public {
		dataUint256 = _d;
	}

	function setDataString(string memory _d) public {
		dataString = _d;
	}

	function setDataMapping(address _a, uint256 _d) public {
		dataMapping[_a] = _d;
	}
}
