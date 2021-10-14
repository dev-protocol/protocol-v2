// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/IMetrics.sol";
import "../../interface/IMetricsFactory.sol";
import "../../interface/IMarketFactory.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./Metrics.sol";

/**
 * A factory contract for creating new Metrics contracts and logical deletion of Metrics contracts.
 */
contract MetricsFactory is InitializableUsingRegistry, IMetricsFactory {
	uint256 public override metricsCount;
	uint256 public override authenticatedPropertiesCount;
	mapping(address => bool) public override isMetrics;
	mapping(address => uint256) public override metricsCountPerProperty;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
	}

	/**
	 * Creates a new Metrics contract.
	 */
	function create(address _property) external override returns (address) {
		/**
		 * Validates the sender is included in the Market address set.
		 */
		require(
			IMarketFactory(registry().registries("MarketFactory")).isMarket(
				msg.sender
			),
			"this is illegal address"
		);

		/**
		 * Creates a new Metrics contract.
		 */
		Metrics newMetrics = new Metrics(msg.sender, _property);

		/**
		 *  Adds the new Metrics contract to the Metrics address set.
		 */
		address metricsAddress = address(newMetrics);
		_addMetrics(metricsAddress);

		emit Create(msg.sender, _property, metricsAddress);
		return metricsAddress;
	}

	/**
	 * Logical deletions a Metrics contract.
	 */
	function destroy(address _metrics) external override {
		/**
		 * Validates the passed address is included in the Metrics address set.
		 */
		require(isMetrics[_metrics], "address is not metrics");

		/**
		 * Validates the sender is included in the Market address set.
		 */
		require(
			IMarketFactory(registry().registries("MarketFactory")).isMarket(
				msg.sender
			),
			"this is illegal address"
		);

		/**
		 *  Validates the sender is the Market contract associated with the passed Metrics.
		 */
		require(
			msg.sender == IMetrics(_metrics).market(),
			"this is illegal address"
		);

		/**
		 * Logical deletions a Metrics contract.
		 */
		_removeMetrics(_metrics);
		emit Destroy(msg.sender, IMetrics(_metrics).property(), _metrics);
	}

	function _addMetrics(address _addr) internal {
		isMetrics[_addr] = true;
		address property = IMetrics(_addr).property();
		uint256 countPerProperty = metricsCountPerProperty[property];
		if (countPerProperty == 0) {
			authenticatedPropertiesCount = authenticatedPropertiesCount + 1;
		}
		metricsCount = metricsCount + 1;
		metricsCountPerProperty[property] = countPerProperty + 1;
	}

	function _removeMetrics(address _addr) internal {
		isMetrics[_addr] = false;
		address property = IMetrics(_addr).property();
		uint256 countPerProperty = metricsCountPerProperty[property];
		if (countPerProperty == 1) {
			authenticatedPropertiesCount = authenticatedPropertiesCount - 1;
		}
		metricsCount = metricsCount - 1;
		metricsCountPerProperty[property] = countPerProperty - 1;
	}

	function hasAssets(address _property)
		external
		view
		override
		returns (bool)
	{
		return metricsCountPerProperty[_property] > 0;
	}
}
