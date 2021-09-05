// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {MetricsGroup} from "contracts/src/metrics/MetricsGroup.sol";

contract MetricsGroupTest is MetricsGroup {
	constructor(address _registry) MetricsGroup(_registry) {}

	function __setMetricsCountPerProperty(address _property, uint256 _value)
		external
	{
		setMetricsCountPerProperty(_property, _value);
	}
}
