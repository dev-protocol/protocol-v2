// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../../src/common/libs/Curve.sol";

contract CurveTest is Curve {
	function curveRewardsTest(
		uint256 _lockups,
		uint256 _assets,
		uint256 _totalSupply,
		uint256 _mintPerBlockAndAseet
	) external pure returns (uint256) {
		return
			curveRewards(
				_lockups,
				_assets,
				_totalSupply,
				_mintPerBlockAndAseet
			);
	}
}
