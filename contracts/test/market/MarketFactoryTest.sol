// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../src/market/MarketFactory.sol";

/**
 * A factory contract that creates a new Market contract.
 */
contract MarketFactoryTest is MarketFactory {
	constructor() MarketFactory() {}

	function __addMarket(address _addr) public {
		_addMarket(_addr);
	}
}
