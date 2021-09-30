// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Decimals} from "contracts/src/common/libs/Decimals.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {IDevBridge} from "contracts/interface/IDevBridge.sol";
import {IProperty} from "contracts/interface/IProperty.sol";
import {IPolicy} from "contracts/interface/IPolicy.sol";
import {ILockup} from "contracts/interface/ILockup.sol";
import {IMetricsFactory} from "contracts/interface/IMetricsFactory.sol";
import {ISTokensManager} from "contracts/interface/ISTokensManager.sol";

/**
 * A contract that manages the staking of DEV tokens and calculates rewards.
 * Staking and the following mechanism determines that reward calculation.
 *
 * Variables:
 * -`M`: Maximum mint amount per block determined by Allocator contract
 * -`B`: Number of blocks during staking
 * -`P`: Total number of staking locked up in a Property contract
 * -`S`: Total number of staking locked up in all Property contracts
 * -`U`: Number of staking per account locked up in a Property contract
 *
 * Formula:
 * Staking Rewards = M * B * (P / S) * (U / P)
 *
 * Note:
 * -`M`, `P` and `S` vary from block to block, and the variation cannot be predicted.
 * -`B` is added every time the Ethereum block is created.
 * - Only `U` and `B` are predictable variables.
 * - As `M`, `P` and `S` cannot be observed from a staker, the "cumulative sum" is often used to calculate ratio variation with history.
 * - Reward withdrawal always withdraws the total withdrawable amount.
 *
 * Scenario:
 * - Assume `M` is fixed at 500
 * - Alice stakes 100 DEV on Property-A (Alice's staking state on Property-A: `M`=500, `B`=0, `P`=100, `S`=100, `U`=100)
 * - After 10 blocks, Bob stakes 60 DEV on Property-B (Alice's staking state on Property-A: `M`=500, `B`=10, `P`=100, `S`=160, `U`=100)
 * - After 10 blocks, Carol stakes 40 DEV on Property-A (Alice's staking state on Property-A: `M`=500, `B`=20, `P`=140, `S`=200, `U`=100)
 * - After 10 blocks, Alice withdraws Property-A staking reward. The reward at this time is 5000 DEV (10 blocks * 500 DEV) + 3125 DEV (10 blocks * 62.5% * 500 DEV) + 2500 DEV (10 blocks * 50% * 500 DEV).
 */
contract Lockup is ILockup, InitializableUsingRegistry {
	uint256 public override cap; // From [get/set]StorageCap
	uint256 public override totalLocked; // From [get/set]StorageAllValue
	uint256 public cumulativeHoldersRewardCap; // From [get/set]StorageCumulativeHoldersRewardCap
	uint256 public lastCumulativeHoldersPriceCap; // From [get/set]StorageLastCumulativeHoldersPriceCap
	uint256 public lastLockedChangedCumulativeReward; // From [get/set]StorageLastStakesChangedCumulativeReward
	uint256 public lastCumulativeHoldersRewardPrice; // From [get/set]StorageLastCumulativeHoldersRewardPrice
	uint256 public lastCumulativeRewardPrice; // From [get/set]StorageLastCumulativeInterestPrice
	uint256 public cumulativeGlobalReward; // From [get/set]StorageCumulativeGlobalRewards
	uint256 public lastSameGlobalRewardAmount; // From [get/set]StorageLastSameRewardsAmountAndBlock
	uint256 public lastSameGlobalRewardTimestamp; // From [get/set]StorageLastSameRewardsAmountAndBlock
	address[] public lockedupProperties;
	mapping(address => uint256)
		public lastCumulativeHoldersRewardPricePerProperty; // {Property: Value} // [get/set]StorageLastCumulativeHoldersRewardPricePerProperty
	mapping(address => uint256) public initialCumulativeHoldersRewardCap; // {Property: Value} // From [get/set]StorageInitialCumulativeHoldersRewardCap
	mapping(address => uint256) public override totalLockedForProperty; // {Property: Value} // From [get/set]StoragePropertyValue
	mapping(address => uint256)
		public lastCumulativeHoldersRewardAmountPerProperty; // {Property: Value} // From [get/set]StorageLastCumulativeHoldersRewardAmountPerProperty

	using Decimals for uint256;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
	}

	/**
	 * @dev Validates the passed Property has greater than 1 asset.
	 * @param _property property address
	 */
	modifier onlyAuthenticatedProperty(address _property) {
		require(
			IMetricsFactory(registry().registries("MetricsFactory")).hasAssets(
				_property
			),
			"unable to stake to unauthenticated property"
		);
		_;
	}

	/**
	 * @dev Check if the owner of the token is a sender.
	 * @param _tokenId The ID of the staking position
	 */
	modifier onlyPositionOwner(uint256 _tokenId) {
		require(
			IERC721(registry().registries("STokensManager")).ownerOf(
				_tokenId
			) == msg.sender,
			"illegal sender"
		);
		_;
	}

	/**
	 * @dev deposit dev token to dev protocol and generate s-token
	 * @param _property target property address
	 * @param _amount staking value
	 * @return tokenId The ID of the created new staking position
	 */
	function depositToProperty(address _property, uint256 _amount)
		external
		override
		onlyAuthenticatedProperty(_property)
		returns (uint256)
	{
		/**
		 * Validates _amount is not 0.
		 */
		require(_amount != 0, "illegal deposit amount");
		/**
		 * Gets the latest cumulative sum of the interest price.
		 */
		(
			uint256 reward,
			uint256 holders,
			uint256 interest,
			uint256 holdersCap
		) = calculateCumulativeRewardPrices();
		/**
		 * Saves variables that should change due to the addition of staking.
		 */
		updateValues(
			true,
			_property,
			_amount,
			RewardPrices(reward, holders, interest, holdersCap)
		);
		/**
		 * transfer dev tokens
		 */
		require(
			IERC20(registry().registries("Dev")).transferFrom(
				msg.sender,
				_property,
				_amount
			),
			"dev transfer failed"
		);
		/**
		 * mint s tokens
		 */
		ISTokensManager sTokenManager = ISTokensManager(
			registry().registries("STokensManager")
		);
		if (sTokenManager.positionsOfProperty(_property).length == 0) {
			lockedupProperties.push(_property);
		}
		uint256 tokenId = sTokenManager.mint(
			msg.sender,
			_property,
			_amount,
			interest
		);
		emit Lockedup(msg.sender, _property, _amount, tokenId);

		return tokenId;
	}

	/**
	 * @dev deposit dev token to dev protocol and update s-token status
	 * @param _tokenId s-token id
	 * @param _amount staking value
	 * @return bool On success, true will be returned
	 */
	function depositToPosition(uint256 _tokenId, uint256 _amount)
		external
		override
		onlyPositionOwner(_tokenId)
		returns (bool)
	{
		/**
		 * Validates _amount is not 0.
		 */
		require(_amount != 0, "illegal deposit amount");
		ISTokensManager sTokenManager = ISTokensManager(
			registry().registries("STokensManager")
		);
		/**
		 * get position information
		 */
		ISTokensManager.StakingPositions memory positions = sTokenManager
			.positions(_tokenId);
		/**
		 * Gets the withdrawable amount.
		 */
		(
			uint256 withdrawable,
			RewardPrices memory prices
		) = _calculateWithdrawableInterestAmount(positions);
		/**
		 * Saves variables that should change due to the addition of staking.
		 */
		updateValues(true, positions.property, _amount, prices);
		/**
		 * transfer dev tokens
		 */
		require(
			IERC20(registry().registries("Dev")).transferFrom(
				msg.sender,
				positions.property,
				_amount
			),
			"dev transfer failed"
		);
		/**
		 * update position information
		 */
		bool result = sTokenManager.update(
			_tokenId,
			positions.amount + _amount,
			prices.interest,
			positions.cumulativeReward + withdrawable,
			positions.pendingReward + withdrawable
		);
		require(result, "failed to update");
		/**
		 * generate events
		 */
		emit Lockedup(msg.sender, positions.property, _amount, _tokenId);
		return true;
	}

	/**
	 * Withdraw staking.(NFT)
	 * Releases staking, withdraw rewards, and transfer the staked and withdraw rewards amount to the sender.
	 */
	function withdrawByPosition(uint256 _tokenId, uint256 _amount)
		external
		override
		onlyPositionOwner(_tokenId)
		returns (bool)
	{
		ISTokensManager sTokenManager = ISTokensManager(
			registry().registries("STokensManager")
		);
		/**
		 * get position information
		 */
		ISTokensManager.StakingPositions memory positions = sTokenManager
			.positions(_tokenId);
		/**
		 * If the balance of the withdrawal request is bigger than the balance you are staking
		 */
		require(positions.amount >= _amount, "insufficient tokens staked");
		/**
		 * Withdraws the staking reward
		 */
		(uint256 value, RewardPrices memory prices) = _withdrawInterest(
			positions
		);
		/**
		 * Transfer the staked amount to the sender.
		 */
		if (_amount != 0) {
			IProperty(positions.property).withdraw(msg.sender, _amount);
		}
		/**
		 * Saves variables that should change due to the canceling staking..
		 */
		updateValues(false, positions.property, _amount, prices);
		uint256 cumulative = positions.cumulativeReward + value;

		/**
		 * update position information
		 */
		bool result = sTokenManager.update(
			_tokenId,
			positions.amount - _amount,
			prices.interest,
			cumulative,
			0
		);
		if (totalLockedForProperty[positions.property] == 0) {
			deleteUnlockedPropertyInfo(positions.property);
		}

		emit Withdrew(msg.sender, positions.property, _amount, value, _tokenId);
		/**
		 * update position information
		 */
		return result;
	}

	/**
	 * get lockup info
	 */
	function getLockedupProperties()
		external
		view
		override
		returns (LockedupProperty[] memory)
	{
		uint256 propertyCount = lockedupProperties.length;
		LockedupProperty[] memory results = new LockedupProperty[](
			propertyCount
		);
		for (uint256 i = 0; i < propertyCount; i++) {
			address property = lockedupProperties[i];
			uint256 value = totalLockedForProperty[property];
			results[i] = LockedupProperty(property, value);
		}
		return results;
	}

	/**
	 * set cap
	 */
	function updateCap(uint256 _cap) external override {
		address setter = registry().registries("CapSetter");
		require(setter == msg.sender, "illegal access");

		/**
		 * Updates cumulative amount of the holders reward cap
		 */
		(
			,
			uint256 holdersPrice,
			,
			uint256 cCap
		) = calculateCumulativeRewardPrices();

		// TODO: When this function is improved to be called on-chain, the source of `lastCumulativeHoldersPriceCap` can be rewritten to `lastCumulativeHoldersRewardPrice`.
		cumulativeHoldersRewardCap = cCap;
		lastCumulativeHoldersPriceCap = holdersPrice;
		cap = _cap;
		emit UpdateCap(_cap);
	}

	/**
	 * Returns the latest cap
	 */
	function _calculateLatestCap(uint256 _holdersPrice)
		private
		view
		returns (uint256)
	{
		uint256 cCap = cumulativeHoldersRewardCap;
		uint256 lastHoldersPrice = lastCumulativeHoldersPriceCap;
		uint256 additionalCap = (_holdersPrice - lastHoldersPrice) * cap;
		return cCap + additionalCap;
	}

	/**
	 * Store staking states as a snapshot.
	 */
	function beforeStakesChanged(address _property, RewardPrices memory _prices)
		private
	{
		/**
		 * Gets latest cumulative holders reward for the passed Property.
		 */
		uint256 cHoldersReward = _calculateCumulativeHoldersRewardAmount(
			_prices.holders,
			_property
		);

		/**
		 * Sets `InitialCumulativeHoldersRewardCap`.
		 * Records this value only when the "first staking to the passed Property" is transacted.
		 */
		if (
			lastCumulativeHoldersRewardPricePerProperty[_property] == 0 &&
			initialCumulativeHoldersRewardCap[_property] == 0 &&
			totalLockedForProperty[_property] == 0
		) {
			initialCumulativeHoldersRewardCap[_property] = _prices.holdersCap;
		}

		/**
		 * Store each value.
		 */
		lastLockedChangedCumulativeReward = _prices.reward;
		lastCumulativeHoldersRewardPrice = _prices.holders;
		lastCumulativeRewardPrice = _prices.interest;
		lastCumulativeHoldersRewardAmountPerProperty[
			_property
		] = cHoldersReward;
		lastCumulativeHoldersRewardPricePerProperty[_property] = _prices
			.holders;
		cumulativeHoldersRewardCap = _prices.holdersCap;
		lastCumulativeHoldersPriceCap = _prices.holders;
	}

	/**
	 * Gets latest value of cumulative sum of the reward amount, cumulative sum of the holders reward per stake, and cumulative sum of the stakers reward per stake.
	 */
	function calculateCumulativeRewardPrices()
		public
		view
		override
		returns (
			uint256 _reward,
			uint256 _holders,
			uint256 _interest,
			uint256 _holdersCap
		)
	{
		uint256 lastReward = lastLockedChangedCumulativeReward;
		uint256 lastHoldersPrice = lastCumulativeHoldersRewardPrice;
		uint256 lastInterestPrice = lastCumulativeRewardPrice;
		uint256 allStakes = totalLocked;

		/**
		 * Gets latest cumulative sum of the reward amount.
		 */
		(uint256 reward, ) = dry();
		uint256 mReward = reward.mulBasis();

		/**
		 * Calculates reward unit price per staking.
		 * Later, the last cumulative sum of the reward amount is subtracted because to add the last recorded holder/staking reward.
		 */
		uint256 price = allStakes > 0 ? (mReward - lastReward) / allStakes : 0;

		/**
		 * Calculates the holders reward out of the total reward amount.
		 */
		uint256 holdersShare = IPolicy(registry().registries("Policy"))
			.holdersShare(price, allStakes);

		/**
		 * Calculates and returns each reward.
		 */
		uint256 holdersPrice = holdersShare + lastHoldersPrice;
		uint256 interestPrice = price - holdersShare + lastInterestPrice;
		uint256 cCap = _calculateLatestCap(holdersPrice);
		return (mReward, holdersPrice, interestPrice, cCap);
	}

	/**
	 * Calculates cumulative sum of the holders reward per Property.
	 * To save computing resources, it receives the latest holder rewards from a caller.
	 */
	function _calculateCumulativeHoldersRewardAmount(
		uint256 _holdersPrice,
		address _property
	) private view returns (uint256) {
		(uint256 cHoldersReward, uint256 lastReward) = (
			lastCumulativeHoldersRewardAmountPerProperty[_property],
			lastCumulativeHoldersRewardPricePerProperty[_property]
		);

		/**
		 * `cHoldersReward` contains the calculation of `lastReward`, so subtract it here.
		 */
		uint256 additionalHoldersReward = (_holdersPrice - lastReward) *
			totalLockedForProperty[_property];

		/**
		 * Calculates and returns the cumulative sum of the holder reward by adds the last recorded holder reward and the latest holder reward.
		 */
		return cHoldersReward + additionalHoldersReward;
	}

	/**
	 * Calculates holders reward and cap per Property.
	 */
	function calculateRewardAmount(address _property)
		external
		view
		override
		returns (uint256, uint256)
	{
		(
			,
			uint256 holders,
			,
			uint256 holdersCap
		) = calculateCumulativeRewardPrices();
		uint256 initialCap = initialCumulativeHoldersRewardCap[_property];

		/**
		 * Calculates the cap
		 */
		uint256 capValue = holdersCap - initialCap;
		return (
			_calculateCumulativeHoldersRewardAmount(holders, _property),
			capValue
		);
	}

	/**
	 * Updates cumulative sum of the maximum mint amount calculated by Allocator contract, the latest maximum mint amount per block,
	 * and the last recorded block number.
	 * The cumulative sum of the maximum mint amount is always added.
	 * By recording that value when the staker last stakes, the difference from the when the staker stakes can be calculated.
	 */
	function update() public override {
		/**
		 * Gets the cumulative sum of the maximum mint amount and the maximum mint number per block.
		 */
		(uint256 _nextRewards, uint256 _amount) = dry();

		/**
		 * Records each value and the latest block number.
		 */
		cumulativeGlobalReward = _nextRewards;
		lastSameGlobalRewardAmount = _amount;
		lastSameGlobalRewardTimestamp = block.timestamp;
	}

	/**
	 * @dev Returns the maximum number of mints per block.
	 * @return Maximum number of mints per block.
	 */
	function calculateMaxRewardsPerBlock() private view returns (uint256) {
		uint256 totalAssets = IMetricsFactory(
			registry().registries("MetricsFactory")
		).metricsCount();
		uint256 totalLockedUps = totalLocked;
		return
			IPolicy(registry().registries("Policy")).rewards(
				totalLockedUps,
				totalAssets
			);
	}

	/**
	 * Referring to the values recorded in each storage to returns the latest cumulative sum of the maximum mint amount and the latest maximum mint amount per block.
	 */
	function dry()
		private
		view
		returns (uint256 _nextRewards, uint256 _amount)
	{
		/**
		 * Gets the latest mint amount per block from Allocator contract.
		 */
		uint256 rewardsAmount = calculateMaxRewardsPerBlock();

		/**
		 * Gets the maximum mint amount per block, and the last recorded block number from `LastSameRewardsAmountAndBlock` storage.
		 */
		(uint256 lastAmount, uint256 lastTs) = (
			lastSameGlobalRewardAmount,
			lastSameGlobalRewardTimestamp
		);

		/**
		 * If the recorded maximum mint amount per block and the result of the Allocator contract are different,
		 * the result of the Allocator contract takes precedence as a maximum mint amount per block.
		 */
		uint256 lastMaxRewards = lastAmount == rewardsAmount
			? rewardsAmount
			: lastAmount;

		/**
		 * Calculates the difference between the latest block number and the last recorded block number.
		 */
		uint256 time = lastTs > 0 ? block.timestamp - lastTs : 0;

		/**
		 * Adds the calculated new cumulative maximum mint amount to the recorded cumulative maximum mint amount.
		 */
		uint256 additionalRewards = lastMaxRewards * time;
		uint256 nextRewards = cumulativeGlobalReward + additionalRewards;

		/**
		 * Returns the latest theoretical cumulative sum of maximum mint amount and maximum mint amount per block.
		 */
		return (nextRewards, rewardsAmount);
	}

	/**
	 * Returns the staker reward as interest.
	 */
	function _calculateInterestAmount(uint256 _amount, uint256 _price)
		private
		view
		returns (
			uint256 amount_,
			uint256 interestPrice_,
			RewardPrices memory prices_
		)
	{
		/**
		 * Gets the latest cumulative sum of the interest price.
		 */
		(
			uint256 reward,
			uint256 holders,
			uint256 interest,
			uint256 holdersCap
		) = calculateCumulativeRewardPrices();

		/**
		 * Calculates and returns the latest withdrawable reward amount from the difference.
		 */
		uint256 result = interest >= _price
			? ((interest - _price) * _amount).divBasis()
			: 0;
		return (
			result,
			interest,
			RewardPrices(reward, holders, interest, holdersCap)
		);
	}

	/**
	 * Returns the total rewards currently available for withdrawal. (For calling from inside the contract)
	 */
	function _calculateWithdrawableInterestAmount(
		ISTokensManager.StakingPositions memory positions
	) private view returns (uint256 amount_, RewardPrices memory prices_) {
		/**
		 * If the passed Property has not authenticated, returns always 0.
		 */
		if (
			IMetricsFactory(registry().registries("MetricsFactory")).hasAssets(
				positions.property
			) == false
		) {
			return (0, RewardPrices(0, 0, 0, 0));
		}

		/**
		 * Gets the latest withdrawal reward amount.
		 */
		(
			uint256 amount,
			,
			RewardPrices memory prices
		) = _calculateInterestAmount(positions.amount, positions.price);

		/**
		 * Returns the sum of all values.
		 */
		uint256 withdrawableAmount = amount + positions.pendingReward;
		return (withdrawableAmount, prices);
	}

	/**
	 * Returns the total rewards currently available for withdrawal. (For calling from external of the contract)
	 */
	function calculateWithdrawableInterestAmountByPosition(uint256 _tokenId)
		external
		view
		override
		returns (uint256)
	{
		ISTokensManager sTokensManagerInstance = ISTokensManager(
			registry().registries("STokensManager")
		);
		ISTokensManager.StakingPositions
			memory positions = sTokensManagerInstance.positions(_tokenId);
		(uint256 result, ) = _calculateWithdrawableInterestAmount(positions);
		return result;
	}

	/**
	 * Withdraws staking reward as an interest.
	 */
	function _withdrawInterest(
		ISTokensManager.StakingPositions memory positions
	) private returns (uint256 value_, RewardPrices memory prices_) {
		/**
		 * Gets the withdrawable amount.
		 */
		(
			uint256 value,
			RewardPrices memory prices
		) = _calculateWithdrawableInterestAmount(positions);

		/**
		 * Mints the reward.
		 */
		require(
			IDevBridge(registry().registries("DevBridge")).mint(
				msg.sender,
				value
			),
			"dev mint failed"
		);

		/**
		 * Since the total supply of tokens has changed, updates the latest maximum mint amount.
		 */
		update();

		return (value, prices);
	}

	/**
	 * Status updates with the addition or release of staking.
	 */
	function updateValues(
		bool _addition,
		address _property,
		uint256 _value,
		RewardPrices memory _prices
	) private {
		beforeStakesChanged(_property, _prices);
		/**
		 * If added staking:
		 */
		if (_addition) {
			/**
			 * Updates the current staking amount of the protocol total.
			 */
			addAllValue(_value);

			/**
			 * Updates the current staking amount of the Property.
			 */
			addPropertyValue(_property, _value);

			/**
			 * If released staking:
			 */
		} else {
			/**
			 * Updates the current staking amount of the protocol total.
			 */
			subAllValue(_value);

			/**
			 * Updates the current staking amount of the Property.
			 */
			subPropertyValue(_property, _value);
		}

		/**
		 * Since each staking amount has changed, updates the latest maximum mint amount.
		 */
		update();
	}

	/**
	 * Adds the staking amount of the protocol total.
	 */
	function addAllValue(uint256 _value) private {
		uint256 value = totalLocked;
		value = value + _value;
		totalLocked = value;
	}

	/**
	 * Subtracts the staking amount of the protocol total.
	 */
	function subAllValue(uint256 _value) private {
		uint256 value = totalLocked;
		value = value - _value;
		totalLocked = value;
	}

	/**
	 * Adds the staking amount of the Property.
	 */
	function addPropertyValue(address _property, uint256 _value) private {
		uint256 value = totalLockedForProperty[_property];
		value = value + _value;
		totalLockedForProperty[_property] = value;
	}

	/**
	 * Subtracts the staking amount of the Property.
	 */
	function subPropertyValue(address _property, uint256 _value) private {
		uint256 value = totalLockedForProperty[_property];
		uint256 nextValue = value - _value;
		totalLockedForProperty[_property] = nextValue;
	}

	/**
	 * delete unlocked property address info
	 */
	function deleteUnlockedPropertyInfo(address _property) private {
		uint256 propertyCount = lockedupProperties.length;
		address[] memory properties = new address[](propertyCount - 1);
		uint256 counter = 0;
		bool deleteFlg = false;
		for (uint256 i = 0; i < propertyCount; i++) {
			address property = lockedupProperties[i];
			if (_property != property) {
				properties[counter] = property;
				counter += 1;
			} else {
				deleteFlg = true;
			}
		}
		if (deleteFlg == false) {
			revert("illegal token id");
		}
		lockedupProperties = properties;
	}
}
