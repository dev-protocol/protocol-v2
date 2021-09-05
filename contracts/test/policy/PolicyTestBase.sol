// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IPolicy} from "contracts/interface/IPolicy.sol";

contract PolicyTestBase is IPolicy {
	using SafeMath for uint256;
	address public override treasury;
	address public override capSetter;

	// solhint-disable-next-line no-unused-vars
	function rewards(uint256 _lockups, uint256 _assets)
		external
		view
		virtual
		override
		returns (uint256)
	{
		return 100000000000000000000;
	}

	function holdersShare(uint256 _amount, uint256 _lockups)
		external
		view
		virtual
		override
		returns (uint256)
	{
		return _lockups > 0 ? (_amount * 90) / 100 : _amount;
	}

	function authenticationFee(uint256 _assets, uint256 _propertyLockups)
		external
		view
		virtual
		override
		returns (uint256)
	{
		return _assets + _propertyLockups + 1;
	}

	function marketVotingBlocks()
		external
		view
		virtual
		override
		returns (uint256)
	{
		return 10;
	}

	function policyVotingBlocks()
		external
		view
		virtual
		override
		returns (uint256)
	{
		return 20;
	}

	function shareOfTreasury(uint256 _supply)
		external
		view
		virtual
		override
		returns (uint256)
	{
		return _supply.div(100).mul(5);
	}

	function setTreasury(address _treasury) external {
		treasury = _treasury;
	}

	function setCapSetter(address _capSetter) external {
		capSetter = _capSetter;
	}
}
