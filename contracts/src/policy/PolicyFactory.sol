// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

<<<<<<< HEAD
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
=======
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
>>>>>>> origin/main
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {IPolicyGroup} from "contracts/interface/IPolicyGroup.sol";
import {IPolicyFactory} from "contracts/interface/IPolicyFactory.sol";

/**
 * A factory contract that creates a new Policy contract.
 */
contract PolicyFactory is UsingRegistry, IPolicyFactory, Ownable {
	event Create(address indexed _from, address _policy);

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	constructor(address _registry) public UsingRegistry(_registry) {}

	/**
	 * Creates a new Policy contract.
	 */
	function create(address _newPolicyAddress) external {
		/**
		 * Validates the passed address is not 0 address.
		 */
		require(_newPolicyAddress != address(0), "this is illegal address");

		emit Create(msg.sender, _newPolicyAddress);

		/**
		 * In the case of the first Policy, it will be activated immediately.
		 */
		IPolicyGroup policyGroup = IPolicyGroup(
			registry().registries("PolicyGroup")
		);
		if (registry().registries("Policy") == address(0)) {
			registry().setRegistry("Policy", _newPolicyAddress);
		}

		/**
		 * Adds the created Policy contract to the Policy address set.
		 */
		policyGroup.addGroup(_newPolicyAddress);
	}

	/**
	 * Set the policy to force a policy without a vote.
	 */
	function forceAttach(address _policy) external onlyOwner {
		/**
		 * Validates the passed Policy address is included the Policy address set
		 */
		require(
			IPolicyGroup(registry().registries("PolicyGroup")).isGroup(_policy),
			"this is illegal address"
		);
		/**
		 * Validates the voting deadline has not passed.
		 */
		IPolicyGroup policyGroup = IPolicyGroup(
			registry().registries("PolicyGroup")
		);
		require(policyGroup.isDuringVotingPeriod(_policy), "deadline is over");

		/**
		 * Sets the passed Policy to current Policy.
		 */
		registry().setRegistry("Policy", _policy);
	}
}
