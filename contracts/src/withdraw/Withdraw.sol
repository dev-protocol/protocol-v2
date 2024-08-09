// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interface/IDevBridge.sol";
import "../../interface/IWithdraw.sol";
import "../../interface/ILockup.sol";
import "../../interface/IMetricsFactory.sol";
import "../../interface/IPropertyFactory.sol";
import "../common/libs/Decimals.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "../../interface/ITransferHistory.sol";

/**
 * A contract that manages the withdrawal of holder rewards for Property holders.
 */
contract Withdraw is InitializableUsingRegistry, IWithdraw, ITransferHistory {
	mapping(address => mapping(address => uint256))
		public lastWithdrawnRewardPrice; // {Property: {User: Value}} // From [get/set]StorageLastWithdrawnReward
	mapping(address => mapping(address => uint256))
		public lastWithdrawnRewardCapPrice; // {Property: {User: Value}} // From [get/set]PendingWithdrawal
	mapping(address => mapping(address => uint256)) public pendingWithdrawal; // {Property: {User: Value}}
	mapping(address => uint256) public cumulativeWithdrawnReward; // {Property: Value} // From [get/set]RewardsAmount
	mapping(address => mapping(uint256 => TransferHistory))
		internal _transferHistory;
	mapping(address => uint256) public transferHistoryLength;
	mapping(address => mapping(address => mapping(uint256 => uint256)))
		public transferHistorySender;
	mapping(address => mapping(address => mapping(uint256 => uint256)))
		public transferHistoryRecipient;
	mapping(address => mapping(address => uint256))
		public transferHistorySenderLength;
	mapping(address => mapping(address => uint256))
		public transferHistoryRecipientLength;

	using Decimals for uint256;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
	}

	/**
	 * Withdraws rewards.
	 */
	function withdraw(address _property) external override {
		/**
		 * Validate
		 * the passed Property address is included the Property address set.
		 */
		require(
			IPropertyFactory(registry().registries("PropertyFactory"))
				.isProperty(_property),
			"this is illegal address"
		);

		/**
		 * Gets the withdrawable rewards amount and the latest cumulative sum of the maximum mint amount.
		 */
		(
			uint256 value,
			uint256 lastPrice,
			uint256 lastPriceCap,

		) = _calculateWithdrawableAmount(IERC20(_property), msg.sender);

		/**
		 * Validates the result is not 0.
		 */
		require(value != 0, "withdraw value is 0");

		/**
		 * Saves the latest cumulative sum of the holder reward price.
		 * By subtracting this value when calculating the next rewards, always withdrawal the difference from the previous time.
		 */
		lastWithdrawnRewardPrice[_property][msg.sender] = lastPrice;
		lastWithdrawnRewardCapPrice[_property][msg.sender] = lastPriceCap;

		/**
		 * Sets the number of unwithdrawn rewards to 0.
		 */
		pendingWithdrawal[_property][msg.sender] = 0;

		/**
		 * Mints the holder reward.
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
		ILockup lockup = ILockup(registry().registries("Lockup"));
		lockup.update();

		/**
		 * Adds the reward amount already withdrawn in the passed Property.
		 */
		cumulativeWithdrawnReward[_property] =
			cumulativeWithdrawnReward[_property] +
			value;
	}

	/**
	 * Updates the change in compensation amount due to the change in the ownership ratio of the passed Property.
	 * When the ownership ratio of Property changes, the reward that the Property holder can withdraw will change.
	 * It is necessary to update the status before and after the ownership ratio changes.
	 */
	function beforeBalanceChange(address _from, address _to) external override {
		/**
		 * Validates the sender is Allocator contract.
		 */
		require(
			IPropertyFactory(registry().registries("PropertyFactory"))
				.isProperty(msg.sender),
			"this is illegal address"
		);

		IERC20 property = IERC20(msg.sender);

		/**
		 * Gets the cumulative sum of the transfer source's "before transfer" withdrawable reward amount and the cumulative sum of the maximum mint amount.
		 */
		(
			uint256 amountFrom,
			uint256 priceFrom,
			uint256 priceCapFrom,

		) = _calculateAmount(property, _from);

		/**
		 * Gets the cumulative sum of the transfer destination's "before receive" withdrawable reward amount and the cumulative sum of the maximum mint amount.
		 */
		(
			uint256 amountTo,
			uint256 priceTo,
			uint256 priceCapTo,

		) = _calculateAmount(property, _to);

		/**
		 * Updates the last cumulative sum of the maximum mint amount of the transfer source and destination.
		 */
		lastWithdrawnRewardPrice[msg.sender][_from] = priceFrom;
		lastWithdrawnRewardPrice[msg.sender][_to] = priceTo;
		lastWithdrawnRewardCapPrice[msg.sender][_from] = priceCapFrom;
		lastWithdrawnRewardCapPrice[msg.sender][_to] = priceCapTo;

		/**
		 * Gets the unwithdrawn reward amount of the transfer source and destination.
		 */
		uint256 pendFrom = pendingWithdrawal[msg.sender][_from];
		uint256 pendTo = pendingWithdrawal[msg.sender][_to];

		/**
		 * Adds the undrawn reward amount of the transfer source and destination.
		 */
		pendingWithdrawal[msg.sender][_from] = pendFrom + amountFrom;
		pendingWithdrawal[msg.sender][_to] = pendTo + amountTo;

		/**
		 * Update TransferHistory
		 */
		updateTransferHistory(property, _from, _to);
	}

	function updateTransferHistory(
		IERC20 _property,
		address _from,
		address _to
	) internal {
		uint256 balanceOfSender = _property.balanceOf(_from);
		uint256 balanceOfRecipient = _property.balanceOf(_to);

		uint256 hId = transferHistoryLength[msg.sender];
		uint256 hSenderId = transferHistorySenderLength[msg.sender][_from];
		uint256 hRecipientId = transferHistoryRecipientLength[msg.sender][_to];

		transferHistorySenderLength[msg.sender][_from] = hSenderId + 1;
		transferHistoryRecipientLength[msg.sender][_to] = hRecipientId + 1;
		transferHistoryLength[msg.sender] = hId + 1;

		_transferHistory[msg.sender][hId] = TransferHistory(
			_to,
			_from,
			0,
			balanceOfRecipient,
			balanceOfSender,
			false,
			block.number
		);
		transferHistorySender[msg.sender][_from][hSenderId] = hId;
		transferHistoryRecipient[msg.sender][_to][hRecipientId] = hId;

		TransferHistory storage lastHistory = _transferHistory[msg.sender][
			hId - 1
		];
		lastHistory.amount =
			lastHistory.sourceOfSender -
			_property.balanceOf(lastHistory.from);
		lastHistory.fill = true;
	}

	/**
	 * Returns the holder reward.
	 */
	function _calculateAmount(
		IERC20 _property,
		address _user
	)
		private
		view
		returns (
			uint256 _amount,
			uint256 _price,
			uint256 _cap,
			uint256 _allReward
		)
	{
		ILockup lockup = ILockup(registry().registries("Lockup"));
		/**
		 * Gets the latest reward.
		 */
		(uint256 reward, uint256 cap) = lockup.calculateRewardAmount(
			address(_property)
		);

		/**
		 * Gets the cumulative sum of the holder reward price recorded the last time you withdrew.
		 */

		uint256 allReward = _calculateAllReward(_property, _user, reward);
		uint256 capped = _calculateCapped(_property, _user, cap);
		uint256 value = capped == 0 ? allReward : allReward <= capped
			? allReward
			: capped;

		/**
		 * Returns the result after adjusted decimals to 10^18, and the latest cumulative sum of the holder reward price.
		 */
		return (value, reward, cap, allReward);
	}

	/**
	 * Return the reward cap
	 */
	function _calculateCapped(
		IERC20 _property,
		address _user,
		uint256 _cap
	) private view returns (uint256) {
		/**
		 * Gets the cumulative sum of the holder reward price recorded the last time you withdrew.
		 */
		uint256 _lastRewardCap = lastWithdrawnRewardCapPrice[
			address(_property)
		][_user];
		uint256 balance = _property.balanceOf(_user);
		uint256 totalSupply = _property.totalSupply();
		uint256 unitPriceCap = _cap >= _lastRewardCap
			? (_cap - _lastRewardCap) / totalSupply
			: _cap / totalSupply; // If this user has held this tokens since before this tokens got its first staking, _lastRewardCap is expected to larger than _cap. In this case, it can treat _cap as the latest range of the value.
		return (unitPriceCap * balance).divBasis();
	}

	/**
	 * Return the reward
	 */
	function _calculateAllReward(
		IERC20 _property,
		address _user,
		uint256 _reward
	) private view returns (uint256) {
		/**
		 * Gets the cumulative sum of the holder reward price recorded the last time you withdrew.
		 */
		uint256 _lastReward = lastWithdrawnRewardPrice[address(_property)][
			_user
		];
		uint256 balance = _property.balanceOf(_user);
		uint256 totalSupply = _property.totalSupply();
		uint256 unitPrice = ((_reward - _lastReward).mulBasis()) / totalSupply;
		return (unitPrice * balance).divBasis().divBasis();
	}

	/**
	 * Returns the total rewards currently available for withdrawal. (For calling from inside the contract)
	 */
	function _calculateWithdrawableAmount(
		IERC20 _property,
		address _user
	)
		private
		view
		returns (
			uint256 _amount,
			uint256 _price,
			uint256 _cap,
			uint256 _allReward
		)
	{
		/**
		 * Gets the latest withdrawal reward amount.
		 */
		(
			uint256 _value,
			uint256 price,
			uint256 cap,
			uint256 allReward
		) = _calculateAmount(_property, _user);

		/**
		 * If the passed Property has not authenticated, returns always 0.
		 */
		if (
			IMetricsFactory(registry().registries("MetricsFactory")).hasAssets(
				address(_property)
			) == false
		) {
			return (0, price, cap, 0);
		}

		/**
		 * Gets the reward amount in saved without withdrawal and returns the sum of all values.
		 */
		uint256 value = _value + pendingWithdrawal[address(_property)][_user];
		return (value, price, cap, allReward);
	}

	/**
	 * Returns the rewards amount
	 */
	function calculateRewardAmount(
		address _property,
		address _user
	)
		external
		view
		override
		returns (
			uint256 _amount,
			uint256 _price,
			uint256 _cap,
			uint256 _allReward
		)
	{
		return _calculateWithdrawableAmount(IERC20(_property), _user);
	}

	/**
	 * @dev Returns TransferHistory.
	 * @param _property Property token address
	 * @param _index TransferHistory index
	 * @return TransferHistory.
	 */
	function transferHistory(
		address _property,
		uint256 _index
	) external view returns (TransferHistory memory) {
		return _transferHistory[_property][_index];
	}
}
