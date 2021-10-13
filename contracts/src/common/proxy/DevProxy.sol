// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DevProxy is ERC1967Proxy {
	constructor(address _logic, bytes memory _data)
		ERC1967Proxy(_logic, _data)
	{}
}
