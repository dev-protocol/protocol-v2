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
		uint256 metricsCount = metricsOfProperty_[_addr].length();
		for (uint256 i = 0; i < metricsCount; i++) {
			address metrics = metricsOfProperty_[_addr].at(i);
			metricsOfProperty_[_addr].remove(metrics);
		}

		require(metricsOfProperty_[_addr].length() == 0, "Improper processing");

		if (_zeroOrOne == 0) {
			return;
		} else if (_zeroOrOne == 1) {
			metricsOfProperty_[_addr].add(address(1));
		} else {
			revert("argument should be specified as 0 or 1");
		}
	}
}
