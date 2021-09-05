// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

contract Migrations {
	address public owner;
	uint256 public lastCompletedMigration;

	modifier restricted() {
		if (msg.sender == owner) _;
	}

	constructor() {
		owner = msg.sender;
	}

	function setCompleted(uint256 completed) public restricted {
		lastCompletedMigration = completed;
	}

	function upgrade(address newAddress) public restricted {
		Migrations upgraded = Migrations(newAddress);
		upgraded.setCompleted(lastCompletedMigration);
	}
}
