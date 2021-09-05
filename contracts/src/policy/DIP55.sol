// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Patch780} from "contracts/src/policy/Patch780.sol";

/**
 * GeometricMean is a contract that changes the `rewards` of DIP7.
 */
contract DIP55 is Patch780 {
	address private capSetterAddress;

	constructor(address _registry) Patch780(_registry) {}

	function setCapSetter(address _setter) external onlyOwner {
		capSetterAddress = _setter;
	}

	function capSetter() external view virtual override returns (address) {
		return capSetterAddress;
	}
}
