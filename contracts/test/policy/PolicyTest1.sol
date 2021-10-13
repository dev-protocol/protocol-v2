// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../src/common/libs/Decimals.sol";
import "./PolicyTestBase.sol";

contract PolicyTest1 is PolicyTestBase {
	using Decimals for uint256;

	function rewards(uint256 _lockups, uint256 _assets)
		external
		pure
		override
		returns (uint256)
	{
		return _lockups + _assets;
	}

	function holdersShare(uint256 _amount, uint256 _lockups)
		external
		pure
		override
		returns (uint256)
	{
		uint256 sum = _amount + _lockups;
		uint256 share = _lockups.outOf(sum);
		return _amount - (_amount * share).divBasis();
	}

	function authenticationFee(uint256 _assets, uint256 _propertyLockups)
		external
		pure
		override
		returns (uint256)
	{
		return _assets + _propertyLockups - 1;
	}
}
