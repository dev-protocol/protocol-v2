// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/ISTokensManager.sol";

contract TokenURIDescriptorLegacyTest {
	mapping(uint256 => bytes32) public _dataOf;
	bool public shouldBe = true;
	string public newImage = "dummy-string";

	function image(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external view returns (string memory) {
		return newImage;
	}

	function onBeforeMint(
		uint256 _tokenId,
		address,
		ISTokensManager.StakingPositions memory,
		bytes32 _payload
	) external returns (bool) {
		_dataOf[_tokenId] = _payload;
		return shouldBe;
	}

	function dataOf(uint256 _tokenId) external view returns (bytes32) {
		return _dataOf[_tokenId];
	}

	function __shouldBe(bool _bool) public {
		shouldBe = _bool;
	}

	function _setImageURI(string memory _imageURI) public {
		newImage = _imageURI;
	}
}
