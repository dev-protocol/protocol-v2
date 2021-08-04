pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

/**
 * A registry contract to hold the latest contract addresses.
 * Dev Protocol will be upgradeable by this contract.
 */
/* solhint-disable max-states-count */
contract AddressRegistry is Ownable, IAddressRegistry {
	mapping(string => address) private reg;

	function setRegistry(string calldata _key, address _addr) external {
		if (keccak256(abi.encodePacked(_key)) == keccak256(abi.encodePacked("Policy"))) {
			address policyFactory = reg["PolicyFactory"];
			require(msg.sender == policyFactory, "this is illegal address");
		} else {
			require(isOwner(), "this is illegal address");
		}
		reg[_key] = _addr;
	}

	function registries(string calldata _key) external view returns (address) {
		return reg[_key];
	}
}
