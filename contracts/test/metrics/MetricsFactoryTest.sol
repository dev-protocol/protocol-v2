// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../src/metrics/MetricsFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MetricsFactoryTest is MetricsFactory {
	constructor() MetricsFactory() {}

	function __addMetrics(address _addr) public {
		_addMetrics(_addr);
	}

	function __removeMetrics(address _addr) public {
		_removeMetrics(_addr);
	}

	function __setMetricsCountPerProperty(address _addr, uint256 _value)
		public
	{
		metricsCountPerProperty[_addr] = _value;
	}
}
