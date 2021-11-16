// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/IMarketBehavior.sol";
import "../../interface/IMarket.sol";
import "../../interface/IDevBridge.sol";
import "../../src/common/registry/UsingRegistry.sol";

contract MarketTest1 is IMarketBehavior, UsingRegistry {
	string public override schema = "[]";
	address public override associatedMarket;
	address private metrics;
	uint256 private lastBlock;
	uint256 private currentBlock;
	mapping(address => string) private keys;
	mapping(string => address) private addresses;

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	constructor(address _registry) UsingRegistry(_registry) {}

	function name() external pure override returns (string memory) {
		return "MarketTest1";
	}

	function authenticate(
		address _prop,
		string[] memory _args,
		address
	) external override returns (bool) {
		{
			require(msg.sender == associatedMarket, "Invalid sender");
		}

		{
			address _metrics = IMarket(msg.sender).authenticatedCallback(
				_prop,
				keccak256(abi.encodePacked(_args[0]))
			);
			keys[_metrics] = _args[0];
			addresses[_args[0]] = _metrics;
		}
		return true;
	}

	function getId(address _metrics)
		external
		view
		override
		returns (string memory)
	{
		return keys[_metrics];
	}

	function getMetrics(string memory _id)
		external
		view
		override
		returns (address)
	{
		return addresses[_id];
	}

	function setAssociatedMarket(address _associatedMarket) external override {
		address marketFactory = registry().registries("MarketFactory");
		require(marketFactory == msg.sender, "illegal sender");
		associatedMarket = _associatedMarket;
	}

	function burnTest(
		address _devBridge,
		address _account,
		uint256 _amount
	) external {
		IDevBridge(_devBridge).burn(_account, _amount);
	}
}
