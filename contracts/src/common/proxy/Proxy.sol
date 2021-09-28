// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.8;

import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract Proxy is TransparentUpgradeableProxy {
	constructor(
		address _logic,
		address admin_,
		bytes memory _data
	) TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
