// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {MarketFactory} from "contracts/src/market/MarketFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MarketFactoryTest is MarketFactory {
	constructor() MarketFactory() {}

	function __addMarkets(address _addr) public {
		_addMarkets(_addr);
	}
}
