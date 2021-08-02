pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {IAddressRegistry} from "contracts/interface/IAddressRegistry.sol";

/**
 * A registry contract to hold the latest contract addresses.
 * Dev Protocol will be upgradeable by this contract.
 */
/* solhint-disable max-states-count */
contract AddressRegistry is Ownable, IAddressRegistry {
	mapping(string => address) public registries;

	function setRegistry(string memory _key, address _addr) external {
		if (key == "Policy") {
			address policyFactory = registries["PolicyFactory"];
			require(msg.sender == policyFactory, "this is illegal address");
		} else {
			require(isOwner(), "this is illegal address");
		}
		registries[_key] = _addr;
	}
}
