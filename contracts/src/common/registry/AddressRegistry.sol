// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../../interface/IAddressRegistry.sol";

/**
 * A registry contract to hold the latest contract addresses.
 * Dev Protocol will be upgradeable by this contract.
 */
contract AddressRegistry is OwnableUpgradeable, IAddressRegistry {
	mapping(bytes32 => address) private reg;

	function initialize() external initializer {
		__Ownable_init();
	}

	function setRegistry(string memory _key, address _addr) external override {
		address sender;
		bytes32 key = keccak256(abi.encodePacked(_key));
		bytes32 policyKey = keccak256(abi.encodePacked("Policy"));
		if (key == policyKey) {
			bytes32 policyFactoryKey = keccak256(
				abi.encodePacked("PolicyFactory")
			);
			sender = reg[policyFactoryKey];
		} else {
			sender = owner();
		}
		require(msg.sender == sender, "this is illegal address");
		reg[key] = _addr;
	}

	function registries(
		string memory _key
	) external view override returns (address) {
		bytes32 key = keccak256(abi.encodePacked(_key));
		return reg[key];
	}
}
