// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../src/metrics/MetricsFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MetricsFactoryTest is MetricsFactory {
	using EnumerableSet for EnumerableSet.AddressSet;

	constructor() MetricsFactory() {}

	function __addMetrics(address _addr) public {
		_addMetrics(_addr);
	}

	function __removeMetrics(address _addr) public {
		_removeMetrics(_addr);
	}

	function __setMetricsCountPerProperty(address _addr, uint8 _zeroOrOne)
		public
	{
		if (_zeroOrOne == 0) {
			metricsOfProperty_[_addr].remove(address(1));
		} else {
			metricsOfProperty_[_addr].add(address(1));
		}
	}
}
