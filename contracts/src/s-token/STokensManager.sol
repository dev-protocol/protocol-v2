// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {STokensDescriptor} from "contracts/src/s-token/STokensDescriptor.sol";
import {IStakingPosition} from "contracts/interface/IStakingPosition.sol";
import {ISTokensManager} from "contracts/interface//ISTokensManager.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";
import {ILockup} from "contracts/interface/ILockup.sol";

contract STokensManager is
	IStakingPosition,
	ISTokensManager,
	STokensDescriptor,
	ERC721EnumerableUpgradeable,
	InitializableUsingRegistry
{
	using Counters for Counters.Counter;
	using SafeMath for uint256;
	Counters.Counter private _tokenIds;
	mapping(bytes32 => bytes) private bytesStorage;
	mapping(address => uint256[]) private tokenIdsMapOfProperty;

	modifier onlyLockup() {
		require(
			registry().registries("Lockup") == _msgSender(),
			"illegal access"
		);
		_;
	}

	function initialize(address _registry) external override initializer {
		__ERC721_init("Dev Protocol sTokens V1", "DEV-STOKENS-V1");
		__UsingRegistry_init(_registry);
	}

	function tokenURI(uint256 _tokenId)
		public
		view
		override
		returns (string memory)
	{
		return getTokenURI(getStoragePositionsV1(_tokenId));
	}

	function mint(
		address _owner,
		address _property,
		uint256 _amount,
		uint256 _price
	) external override onlyLockup returns (uint256 tokenId_) {
		_tokenIds.increment();
		uint256 newTokenId = _tokenIds.current();
		_safeMint(_owner, newTokenId);
		emit Minted(newTokenId, _owner, _property, _amount, _price);
		StakingPositionV1 memory newPosition = StakingPositionV1(
			_property,
			_amount,
			_price,
			0,
			0
		);
		setStoragePositionsV1(newTokenId, newPosition);
		tokenIdsMapOfProperty[_property].push(newTokenId);
		return newTokenId;
	}

	function update(
		uint256 _tokenId,
		uint256 _amount,
		uint256 _price,
		uint256 _cumulativeReward,
		uint256 _pendingReward
	) external override onlyLockup returns (bool) {
		StakingPositionV1 memory currentPosition = getStoragePositionsV1(
			_tokenId
		);
		currentPosition.amount = _amount;
		currentPosition.price = _price;
		currentPosition.cumulativeReward = _cumulativeReward;
		currentPosition.pendingReward = _pendingReward;
		setStoragePositionsV1(_tokenId, currentPosition);
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
		returns (
			address property_,
			uint256 amount_,
			uint256 price_,
			uint256 cumulativeReward_,
			uint256 pendingReward_
		)
	{
		StakingPositionV1 memory currentPosition = getStoragePositionsV1(
			_tokenId
		);
		return (
			currentPosition.property,
			currentPosition.amount,
			currentPosition.price,
			currentPosition.cumulativeReward,
			currentPosition.pendingReward
		);
	}

	function rewards(uint256 _tokenId)
		external
		view
		override
		returns (
			uint256 entireReward_,
			uint256 cumulativeReward_,
			uint256 withdrawableReward_
		)
	{
		uint256 withdrawableReward = ILockup(registry().registries("Lockup"))
			.calculateWithdrawableInterestAmountByPosition(_tokenId);
		StakingPositionV1 memory currentPosition = getStoragePositionsV1(
			_tokenId
		);
		uint256 cumulativeReward = currentPosition.cumulativeReward;
		uint256 entireReward = cumulativeReward.add(withdrawableReward);

		return (entireReward, cumulativeReward, withdrawableReward);
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
		if (_owner == address(0)) {
			return new uint256[](0);
		}
		uint256 balance = balanceOf(_owner);
		uint256[] memory tokenIds = new uint256[](balance);
		for (uint256 i = 0; i < balance; i++) {
			uint256 tokenId = tokenOfOwnerByIndex(_owner, i);
			tokenIds[i] = tokenId;
		}
		return tokenIds;
	}

	function getStoragePositionsV1(uint256 _tokenId)
		private
		view
		returns (StakingPositionV1 memory)
	{
		bytes32 key = getStoragePositionsV1Key(_tokenId);
		bytes memory tmp = bytesStorage[key];
		return abi.decode(tmp, (StakingPositionV1));
	}

	function setStoragePositionsV1(
		uint256 _tokenId,
		StakingPositionV1 memory _position
	) private {
		bytes32 key = getStoragePositionsV1Key(_tokenId);
		bytes memory tmp = abi.encode(_position);
		bytesStorage[key] = tmp;
	}

	function getStoragePositionsV1Key(uint256 _tokenId)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_positionsV1", _tokenId));
	}
}
