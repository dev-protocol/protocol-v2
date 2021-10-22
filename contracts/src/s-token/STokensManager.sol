// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../interface/IL2STokensManager.sol";
import "../../interface/IL2Lockup.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./STokensDescriptor.sol";

contract STokensManager is
	IL2STokensManager,
	STokensDescriptor,
	ERC721Upgradeable,
	InitializableUsingRegistry
{
	Counters.Counter private tokenIdCounter;
	mapping(bytes32 => bytes) private bytesStorage;
	mapping(address => uint256[]) private tokenIdsMapOfProperty;
	mapping(address => EnumerableSet.UintSet) private tokenIdsMapOfOwner;

	using Counters for Counters.Counter;
	using EnumerableSet for EnumerableSet.UintSet;

	modifier onlyLockup() {
		require(
			registry().registries("Lockup") == _msgSender(),
			"illegal access"
		);
		_;
	}

	function initialize(address _registry) external initializer {
		__ERC721_init("Dev Protocol sTokens V1", "DEV-STOKENS-V1");
		__UsingRegistry_init(_registry);
	}

	function tokenURI(uint256 _tokenId)
		public
		view
		override
		returns (string memory)
	{
		StakingPositions memory positons = getStoragePositions(_tokenId);
		return
			getTokenURI(
				positons.property,
				positons.amount,
				positons.cumulativeReward
			);
	}

	function mint(
		address _owner,
		address _property,
		uint256 _amount,
		uint256 _price
	) external override onlyLockup returns (uint256 tokenId_) {
		tokenIdCounter.increment();
		_safeMint(_owner, tokenIdCounter.current());
		emit Minted(
			tokenIdCounter.current(),
			_owner,
			_property,
			_amount,
			_price
		);
		StakingPositions memory newPosition = StakingPositions(
			_property,
			_amount,
			_price,
			0,
			0
		);
		setStoragePositions(tokenIdCounter.current(), newPosition);
		tokenIdsMapOfProperty[_property].push(tokenIdCounter.current());
		return tokenIdCounter.current();
	}

	function update(
		uint256 _tokenId,
		uint256 _amount,
		uint256 _price,
		uint256 _cumulativeReward,
		uint256 _pendingReward
	) external override onlyLockup returns (bool) {
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		currentPosition.amount = _amount;
		currentPosition.price = _price;
		currentPosition.cumulativeReward = _cumulativeReward;
		currentPosition.pendingReward = _pendingReward;
		setStoragePositions(_tokenId, currentPosition);
		emit Updated(
			_tokenId,
			_amount,
			_price,
			_cumulativeReward,
			_pendingReward
		);
		return true;
	}

	function positions(uint256 _tokenId)
		external
		view
		override
		returns (StakingPositions memory)
	{
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		return currentPosition;
	}

	function rewards(uint256 _tokenId)
		external
		view
		override
		returns (Rewards memory)
	{
		uint256 withdrawableReward = IL2Lockup(registry().registries("Lockup"))
			.calculateWithdrawableInterestAmountByPosition(_tokenId);
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		uint256 cumulativeReward = currentPosition.cumulativeReward;
		uint256 entireReward = cumulativeReward + withdrawableReward;

		return Rewards(entireReward, cumulativeReward, withdrawableReward);
	}

	function positionsOfProperty(address _property)
		external
		view
		override
		returns (uint256[] memory)
	{
		return tokenIdsMapOfProperty[_property];
	}

	function positionsOfOwner(address _owner)
		external
		view
		override
		returns (uint256[] memory)
	{
		return tokenIdsMapOfOwner[_owner].values();
	}

	function getStoragePositions(uint256 _tokenId)
		private
		view
		returns (StakingPositions memory)
	{
		bytes32 key = getStoragePositionsKey(_tokenId);
		bytes memory tmp = bytesStorage[key];
		return abi.decode(tmp, (StakingPositions));
	}

	function setStoragePositions(
		uint256 _tokenId,
		StakingPositions memory _position
	) private {
		bytes32 key = getStoragePositionsKey(_tokenId);
		bytes memory tmp = abi.encode(_position);
		bytesStorage[key] = tmp;
	}

	function getStoragePositionsKey(uint256 _tokenId)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_positions", _tokenId));
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal virtual override {
		super._beforeTokenTransfer(from, to, tokenId);

		if (from == address(0)) {
			// mint
			tokenIdsMapOfOwner[to].add(tokenId);
		} else if (to == address(0)) {
			// burn
			revert("s tokens is not burned");
		} else if (to != from) {
			tokenIdsMapOfOwner[from].remove(tokenId);
			tokenIdsMapOfOwner[to].add(tokenId);
		}
	}
}
