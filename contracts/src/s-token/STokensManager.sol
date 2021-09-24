// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {InitializableUsingRegistry} from "../common/registry/InitializableUsingRegistry.sol";
import {STokensDescriptor} from "./STokensDescriptor.sol";
import {ISTokensManager} from "../../interface//ISTokensManager.sol";
import {IAddressRegistry} from "../../interface/IAddressRegistry.sol";
import {ILockup} from "../../interface/ILockup.sol";


contract STokensManager is
	ISTokensManager,
	STokensDescriptor,
	ERC721Upgradeable,
	InitializableUsingRegistry
{
	uint256 public tokenIdCounter;
	mapping(bytes32 => bytes) private bytesStorage;
	mapping(address => uint256[]) private tokenIdsMapOfProperty;
	mapping(address => uint256[]) private tokenIdsMapOfOwner;
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
		tokenIdCounter += 1;
		_safeMint(_owner, tokenIdCounter);
		emit Minted(tokenIdCounter, _owner, _property, _amount, _price);
		StakingPositions memory newPosition = StakingPositions(
			_property,
			_amount,
			_price,
			0,
			0
		);
		setStoragePositions(tokenIdCounter, newPosition);
		tokenIdsMapOfProperty[_property].push(tokenIdCounter);
		return tokenIdCounter;
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
		uint256 withdrawableReward = ILockup(registry().registries("Lockup"))
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
		return tokenIdsMapOfOwner[_owner];
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
			tokenIdsMapOfOwner[to].push(tokenId);
		} else if (to == address(0)) {
			// burn
			revert("s tokens is not burned");
		} else if (to != from) {
			// transfer
			uint256 balance = tokenIdsMapOfOwner[from].length;
			uint256[] memory tokenIds = new uint256[](balance - 1);
			uint256 counter = 0;
			bool deleteFlg = false;
			for (uint256 i = 0; i < balance; i++) {
				uint256 _tokenId = tokenIdsMapOfOwner[from][i];
				if (tokenId != _tokenId) {
					tokenIds[counter] = _tokenId;
					counter += 1;
				} else {
					deleteFlg = true;
				}
			}
			if (deleteFlg == false) {
				revert("illegal token id");
			}
			tokenIdsMapOfOwner[from] = tokenIds;
			tokenIdsMapOfOwner[to].push(tokenId);
		}
	}
}
