// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../interface/ISTokensManager.sol";
import "../../interface/ITokenURIDescriptor.sol";
import "../../interface/IAddressRegistry.sol";
import "../../interface/ILockup.sol";
import "../../interface/IProperty.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./STokensDescriptor.sol";

contract STokensManager is
	ISTokensManager,
	STokensDescriptor,
	IERC721EnumerableUpgradeable,
	ERC721Upgradeable,
	InitializableUsingRegistry
{
	Counters.Counter private tokenIdCounter;
	mapping(bytes32 => bytes) private bytesStorage;
	mapping(address => uint256[]) private tokenIdsMapOfProperty;
	mapping(address => EnumerableSet.UintSet) private tokenIdsMapOfOwner;
	mapping(uint256 => string) private tokenUriImage;
	mapping(uint256 => bool) public override isFreezed;
	mapping(address => address) public override descriptorOf;
	mapping(address => mapping(bytes32 => address))
		public
		override descriptorOfPropertyByPayload;
	mapping(uint256 => bytes32) public override payloadOf;
	mapping(address => uint24) public royaltyOf;
	address private proxyAdmin;

	using Counters for Counters.Counter;
	using EnumerableSet for EnumerableSet.UintSet;

	modifier onlyLockup() {
		require(
			registry().registries("Lockup") == _msgSender(),
			"illegal access"
		);
		_;
	}

	modifier onlyAuthor(uint256 _tokenId) {
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		address author = IProperty(currentPosition.property).author();
		require(author == _msgSender(), "illegal access");
		_;
	}

	modifier onlyPropertyAuthor(address _property) {
		address author = IProperty(_property).author();
		require(author == _msgSender(), "illegal access");
		_;
	}

	function initialize(address _registry) external initializer {
		__ERC721_init("Dev Protocol sTokens V1", "DEV-STOKENS-V1");
		__UsingRegistry_init(_registry);
	}

	/**
	 * @dev See {IERC165-supportsInterface}.
	 */
	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		virtual
		override(IERC165Upgradeable, ERC721Upgradeable)
		returns (bool)
	{
		return
			interfaceId == type(IERC721EnumerableUpgradeable).interfaceId ||
			super.supportsInterface(interfaceId);
	}

	/**
	 * @dev See {IERC721Enumerable-totalSupply}.
	 */
	function totalSupply() public view virtual override returns (uint256) {
		return tokenIdCounter.current();
	}

	/**
	 * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
	 */
	function tokenOfOwnerByIndex(
		address _owner,
		uint256 index
	) public view virtual override returns (uint256) {
		// solhint-disable-next-line reason-string
		require(
			index < tokenIdsMapOfOwner[_owner].length(),
			"ERC721Enumerable: owner index out of bounds"
		);
		return tokenIdsMapOfOwner[_owner].at(index);
	}

	/**
	 * @dev See {IERC721Enumerable-tokenByIndex}.
	 */
	function tokenByIndex(
		uint256 index
	) public view virtual override returns (uint256) {
		// solhint-disable-next-line reason-string
		require(
			index < tokenIdCounter.current(),
			"ERC721Enumerable: global index out of bounds"
		);
		return index + 1;
	}

	function owner() external view returns (address) {
		return ProxyAdmin(proxyAdmin).owner();
	}

	function setProxyAdmin(address _proxyAdmin) external {
		require(proxyAdmin == address(0), "already set");
		proxyAdmin = _proxyAdmin;
	}

	function tokenURI(
		uint256 _tokenId
	) public view override returns (string memory) {
		uint256 curretnTokenId = tokenIdCounter.current();
		require(_tokenId <= curretnTokenId, "not found");
		StakingPositions memory positons = getStoragePositions(_tokenId);
		Rewards memory tokenRewards = _rewards(_tokenId);
		address _owner = ownerOf(_tokenId);
		return
			_tokenURI(
				_tokenId,
				_owner,
				positons,
				tokenRewards,
				payloadOf[_tokenId]
			);
	}

	function tokenURISim(
		uint256 _tokenId,
		address _owner,
		StakingPositions memory _positions,
		Rewards memory _rewardsArg,
		bytes32 _payload
	) external view override returns (string memory) {
		return _tokenURI(_tokenId, _owner, _positions, _rewardsArg, _payload);
	}

	function currentIndex() external view override returns (uint256) {
		return tokenIdCounter.current();
	}

	function mint(
		address _owner,
		address _property,
		uint256 _amount,
		uint256 _price,
		bytes32 _payload
	) external override onlyLockup returns (uint256 tokenId_) {
		tokenIdCounter.increment();
		uint256 currentId = tokenIdCounter.current();
		_mint(_owner, currentId);
		emit Minted(currentId, _owner, _property, _amount, _price);
		StakingPositions memory newPosition = StakingPositions(
			_property,
			_amount,
			_price,
			0,
			0
		);
		// TODO V3 block number and history
		setStoragePositions(currentId, newPosition);
		tokenIdsMapOfProperty[_property].push(currentId);

		address descriptor = descriptorOfPropertyByPayload[_property][_payload];
		if (descriptor == address(0)) {
			descriptor = descriptorOf[_property];
		}
		if (descriptor != address(0)) {
			require(
				ITokenURIDescriptor(descriptor).onBeforeMint(
					currentId,
					_owner,
					newPosition,
					_payload
				),
				"failed to call onBeforeMint"
			);
		}
		payloadOf[currentId] = _payload;

		return currentId;
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

	function setTokenURIImage(
		uint256 _tokenId,
		string memory _data
	) external override onlyAuthor(_tokenId) {
		require(isFreezed[_tokenId] == false, "freezed");
		tokenUriImage[_tokenId] = _data;
	}

	function setTokenURIDescriptor(
		address _property,
		address _descriptor
	) external override onlyPropertyAuthor(_property) {
		descriptorOf[_property] = _descriptor;
	}

	function setTokenURIDescriptor(
		address _property,
		address _descriptor,
		bytes32[] calldata _keys
	) external override onlyPropertyAuthor(_property) {
		for (uint256 i = 0; i < _keys.length; i++) {
			descriptorOfPropertyByPayload[_property][_keys[i]] = _descriptor;
		}
	}

	function freezeTokenURI(
		uint256 _tokenId
	) external override onlyAuthor(_tokenId) {
		require(isFreezed[_tokenId] == false, "already freezed");
		string memory tokeUri = tokenUriImage[_tokenId];
		require(bytes(tokeUri).length != 0, "no data");
		isFreezed[_tokenId] = true;
		emit Freezed(_tokenId, _msgSender());
	}

	function positions(
		uint256 _tokenId
	) external view override returns (StakingPositions memory) {
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		return currentPosition;
	}

	function rewards(
		uint256 _tokenId
	) external view override returns (Rewards memory) {
		return _rewards(_tokenId);
	}

	function positionsOfProperty(
		address _property
	) external view override returns (uint256[] memory) {
		return tokenIdsMapOfProperty[_property];
	}

	function positionsOfOwner(
		address _owner
	) external view override returns (uint256[] memory) {
		return tokenIdsMapOfOwner[_owner].values();
	}

	function _rewards(uint256 _tokenId) private view returns (Rewards memory) {
		uint256 withdrawableReward = ILockup(registry().registries("Lockup"))
			.calculateWithdrawableInterestAmountByPosition(_tokenId);
		StakingPositions memory currentPosition = getStoragePositions(_tokenId);
		uint256 cumulativeReward = currentPosition.cumulativeReward;
		uint256 entireReward = cumulativeReward + withdrawableReward;

		return Rewards(entireReward, cumulativeReward, withdrawableReward);
	}

	function _tokenURI(
		uint256 _tokenId,
		address _owner,
		StakingPositions memory _positions,
		Rewards memory _rewardsArg,
		bytes32 _payload
	) private view returns (string memory) {
		string memory _tokenUriImage = tokenUriImage[_tokenId];
		string memory _tokenUriName;
		string memory _tokenUriDescription;
		if (bytes(_tokenUriImage).length == 0) {
			address descriptor = descriptorOfPropertyByPayload[
				_positions.property
			][_payload];
			if (descriptor == address(0)) {
				descriptor = descriptorOf[_positions.property];
			}
			if (descriptor != address(0)) {
				_tokenUriImage = ITokenURIDescriptor(descriptor).image(
					_tokenId,
					_owner,
					_positions,
					_rewardsArg,
					_payload
				);
				_tokenUriName = ITokenURIDescriptor(descriptor).name(
					_tokenId,
					_owner,
					_positions,
					_rewardsArg,
					_payload
				);
				_tokenUriDescription = ITokenURIDescriptor(descriptor)
					.description(
						_tokenId,
						_owner,
						_positions,
						_rewardsArg,
						_payload
					);
			}
		}
		return
			getTokenURI(
				_positions.property,
				_positions.amount,
				_positions.cumulativeReward,
				_tokenUriImage,
				_tokenUriName,
				_tokenUriDescription
			);
	}

	function getStoragePositions(
		uint256 _tokenId
	) private view returns (StakingPositions memory) {
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

	function getStoragePositionsKey(
		uint256 _tokenId
	) private pure returns (bytes32) {
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

	/// @dev Sets a resale royalty for the passed Property Tokens's STokens
	/// @param _property the property for which we register the royalties
	/// @param _percentage percentage (using 2 decimals - 10000 = 100, 0 = 0)

	function setSTokenRoyaltyForProperty(
		address _property,
		uint256 _percentage
	) external onlyPropertyAuthor(_property) {
		require(_percentage <= 10000, "ERC2981Royalties: Too high");
		royaltyOf[_property] = uint24(_percentage);
	}

	/**
	 * @dev See {IERC2981Royalties}
	 */
	function royaltyInfo(
		uint256 tokenId,
		uint256 value
	) external view returns (address receiver, uint256 royaltyAmount) {
		StakingPositions memory currentPosition = getStoragePositions(tokenId);
		receiver = IProperty(currentPosition.property).author();
		royaltyAmount = (value * royaltyOf[currentPosition.property]) / 10000;
	}
}
