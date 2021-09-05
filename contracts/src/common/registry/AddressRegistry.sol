<<<<<<< HEAD
// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
=======
pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
>>>>>>> origin/main
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

/**
 * A registry contract to hold the latest contract addresses.
 * Dev Protocol will be upgradeable by this contract.
 */
/* solhint-disable max-states-count */
contract AddressRegistry is Ownable, IAddressRegistry {
	mapping(string => address) private reg;

	function setRegistry(string calldata _key, address _addr) external {
<<<<<<< HEAD
		address sender;
=======
>>>>>>> origin/main
		if (
			keccak256(abi.encodePacked(_key)) ==
			keccak256(abi.encodePacked("Policy"))
		) {
<<<<<<< HEAD
			sender = reg["PolicyFactory"];
		} else {
			sender = owner();
		}
		require(msg.sender == sender, "this is illegal address");
=======
			address policyFactory = reg["PolicyFactory"];
			require(msg.sender == policyFactory, "this is illegal address");
		} else {
			require(isOwner(), "this is illegal address");
		}
>>>>>>> origin/main
		reg[_key] = _addr;
	}

	function registries(string calldata _key) external view returns (address) {
		return reg[_key];
	}
}
