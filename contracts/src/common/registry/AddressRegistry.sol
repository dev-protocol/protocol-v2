// SPDX-License-Identifier: MPL-2.0
pragma solidity = 0.8.6;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

/**
 * A registry contract to hold the latest contract addresses.
 * Dev Protocol will be upgradeable by this contract.
 */
/* solhint-disable max-states-count */
contract AddressRegistry is Ownable, IAddressRegistry {
	mapping(string => address) private reg;

	function setRegistry(string calldata _key, address _addr) external {
		address sender;
		if (
			keccak256(abi.encodePacked(_key)) ==
			keccak256(abi.encodePacked("Policy"))
		) {
			sender = reg["PolicyFactory"];
		} else {
			sender = owner();
		}
		require(msg.sender == sender, "this is illegal address");
		reg[_key] = _addr;
	}

	function registries(string calldata _key) external view returns (address) {
		return reg[_key];
	}
}
