// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {IMarketBehavior} from "contracts/interface/IMarketBehavior.sol";
import {IMarket} from "contracts/interface/IMarket.sol";

contract MarketTest2 is Ownable, IMarketBehavior, UsingRegistry {
	string public override schema = "[]";
	address private associatedMarket;
	mapping(address => string) internal keys;
	mapping(string => address) private addresses;

	constructor(address _registry) UsingRegistry(_registry) {}

	function name() external pure override returns (string memory) {
		return "MarketTest2";
	}

	function authenticate(
		address _prop,
		string[] memory _args,
		address market,
		address
	) external override returns (bool) {
		require(msg.sender == associatedMarket, "Invalid sender");

		bytes32 idHash = keccak256(abi.encodePacked(_args[0]));
		address _metrics = IMarket(market).authenticatedCallback(_prop, idHash);
		keys[_metrics] = _args[0];
		addresses[_args[0]] = _metrics;
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

	function getMetrics(string calldata _id)
		external
		view
		override
		returns (address)
	{
		return addresses[_id];
	}

	function setAssociatedMarket(address _associatedMarket) external onlyOwner {
		associatedMarket = _associatedMarket;
	}
}
