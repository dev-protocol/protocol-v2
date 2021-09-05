// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {DIP7} from "contracts/src/policy/DIP7.sol";

/**
 * TreasuryFee is a contract that changes the `rewards` of DIP7.
 */
contract TreasuryFee is DIP7, Ownable {
	address private treasuryAddress;
	using SafeMath for uint256;

	constructor(address _registry) DIP7(_registry) {}

	function shareOfTreasury(uint256 _supply)
		external
		pure
		override
		returns (uint256)
	{
		return _supply.div(100).mul(5);
	}

	function treasury() external view override returns (address) {
		return treasuryAddress;
	}

	function setTreasury(address _treasury) external onlyOwner {
		treasuryAddress = _treasury;
	}
}
