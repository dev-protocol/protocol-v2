// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {Market} from "contracts/src/market/Market.sol";
import {IMarket} from "contracts/interface/IMarket.sol";
import {IMarketBehavior} from "contracts/interface/IMarketBehavior.sol";
import {IMarketFactory} from "contracts/interface/IMarketFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MarketFactory is
	InitializableUsingRegistry,
	OwnableUpgradeable,
	IMarketFactory
{
	using SafeMath for uint256;

	mapping(address => bool) public override isMarket;
	mapping(address => bool) public override isPotentialMarket;
	uint256 public override marketsCount;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external override initializer {
		__Ownable_init();
		__UsingRegistry_init(_registry);
	}

	/**
	 * Creates a new Market contract.
	 */
	function create(address _addr) external override returns (address) {
		/**
		 * Validates the passed address is not 0 address.
		 */
		require(_addr != address(0), "this is illegal address");

		/**
		 * Creates a new Market contract with the passed address as the IMarketBehavior.
		 */
		Market market = new Market(address(registry()), _addr);

		/**
		 * Adds the created Market contract to the Market address set.
		 */
		address marketAddr = address(market);
		isPotentialMarket[marketAddr] = true;

		/**
		 * set associated market address to behavior
		 */
		IMarketBehavior(_addr).setAssociatedMarket(marketAddr);

		/**
		 * For the first Market contract, it will be activated immediately.
		 * If not, the Market contract will be activated after a vote by the voters.
		 */
		if (marketsCount == 0) {
			_enable(marketAddr);
		}

		emit Create(marketAddr, msg.sender);
		return marketAddr;
	}

	/**
	 * Creates a new Market contract.
	 */
	function enable(address _addr) external override onlyOwner {
		_enable(_addr);
	}

	function _enable(address _addr) internal {
		/**
		 * Validates the passed address is not 0 address.
		 */
		require(isPotentialMarket[_addr], "this is illegal address");

		_addMarket(_addr);

		/**
		 * Market will be enable.
		 */
		IMarket market = IMarket(_addr);
		require(market.enabled() == false, "already enabled");

		market.toEnable();
	}

	function _addMarket(address _addr) internal {
		isMarket[_addr] = true;
		_addCount();
	}

	function _addCount() internal {
		marketsCount = marketsCount.add(1);
	}
}
