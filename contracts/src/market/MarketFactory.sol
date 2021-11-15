// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../interface/IMarket.sol";
import "../../interface/IMarketBehavior.sol";
import "../../interface/IMarketFactory.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./Market.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MarketFactory is
	InitializableUsingRegistry,
	OwnableUpgradeable,
	IMarketFactory
{
	uint256 public override marketsCount;
	address[] public enabledMarkets;
	mapping(address => bool) public override isMarket;
	mapping(address => bool) public override isPotentialMarket;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
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
	 * active Market contract.
	 */
	function enable(address _addr) external override onlyOwner {
		_enable(_addr);
	}

	/**
	 * deactive Market contract.
	 */
	function disable(address _addr) external override onlyOwner {
		isMarket[_addr] = false;
		marketsCount -= 1;
		IMarket market = IMarket(_addr);
		require(market.enabled() == true, "already disabled");
		market.toDisable();
		for (uint256 i = 0; i < enabledMarkets.length; i++) {
			if (enabledMarkets[i] == _addr) {
				delete enabledMarkets[i];
				return;
			}
		}
		revert("illegal address");
	}

	function getEnabledMarkets() external view returns (address[] memory) {
		return enabledMarkets;
	}

	function _enable(address _addr) private {
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
		enabledMarkets.push(_addr);
	}

	function _addMarket(address _addr) internal {
		isMarket[_addr] = true;
		marketsCount += 1;
	}
}
