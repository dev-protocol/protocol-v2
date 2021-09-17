// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {IPolicy} from "contracts/interface/IPolicy.sol";

contract PolicyTestBase is IPolicy {
	function rewards(uint256, uint256)
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

	function marketVotingSeconds()
		external
		view
		virtual
		override
		returns (uint256)
	{
		return 10;
	}

	function policyVotingSeconds()
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
		return (_supply / 100) * 5;
	}
}
