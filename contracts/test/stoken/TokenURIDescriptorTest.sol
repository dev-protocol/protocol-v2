// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/ITokenURIDescriptor.sol";

contract TokenURIDescriptorTest is ITokenURIDescriptor {
	mapping(uint256 => bytes32) public _dataOf;
	bool public shouldBe = true;

	function image(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory,
		bytes32
	) external pure override returns (string memory) {
		return "dummy-string";
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

	function name(
		uint256 _tokenId,
		address _owner,
		ISTokensManager.StakingPositions memory _positions,
		ISTokensManager.Rewards memory _rewards,
		bytes32 _payload
	) external view override returns (string memory) {}

	function description(
		uint256 _tokenId,
		address _owner,
		ISTokensManager.StakingPositions memory _positions,
		ISTokensManager.Rewards memory _rewards,
		bytes32 _payload
	) external view override returns (string memory) {}
}
