// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/ITokenURIDescriptor.sol";

contract TokenURIDescriptorTest is ITokenURIDescriptor {
	mapping(uint256 => bytes32) public _dataOf;
	bool public shouldBe = true;
	string public newName = "";
	string public newDescription = "";
	string public newImage = "dummy-string";
	string public newAnimationUrl = "dummy-animation-string";

	function image(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external view override returns (string memory) {
		return newImage;
	}

	function animationUrl(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external view returns (string memory) {
		return newAnimationUrl;
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

	function _setName(string memory _name) public {
		newName = _name;
	}

	function _setDescription(string memory _description) public {
		newDescription = _description;
	}

	function _setImageURI(string memory _imageURI) public {
		newImage = _imageURI;
	}

	function _setAnimationUrl(string memory _animationUrl) public {
		newAnimationUrl = _animationUrl;
	}

	function name(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external view override returns (string memory) {
		return newName;
	}

	function description(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external view override returns (string memory) {
		return newDescription;
	}
}
