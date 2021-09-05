// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {IMetrics} from "contracts/interface/IMetrics.sol";

/**
 * A contract for associating a Property and an asset authenticated by a Market.
 */
contract Metrics is IMetrics {
	address public override market;
	address public override property;

	constructor(address _market, address _property) {
		//Do not validate because there is no AddressRegistry
		market = _market;
		property = _property;
	}
}
