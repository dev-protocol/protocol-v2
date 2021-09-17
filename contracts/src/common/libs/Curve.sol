// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

contract Curve {
	uint256 private constant BASIS = 10000000000000000000000000;
	uint256 private constant POWER_BASIS = 10000000000;

	/**
	 * @dev From the passed variables, calculate the amount of reward reduced along the curve.
	 * @param _lockups Total number of locked up tokens.
	 * @param _assets Total number of authenticated assets.
	 * @param _totalSupply Total supply the token.
	 * @param _mintPerBlockAndAseet Maximum number of reward per block per asset.
	 * @return Calculated reward amount per block per asset.
	 */
	function curveRewards(
		uint256 _lockups,
		uint256 _assets,
		uint256 _totalSupply,
		uint256 _mintPerBlockAndAseet
	) internal pure returns (uint256) {
		uint256 t = _totalSupply;
		uint256 s = (_lockups * BASIS) / t;
		uint256 assets = _assets * (BASIS - s);
		uint256 max = assets * _mintPerBlockAndAseet;
		uint256 _d = BASIS - s;
		uint256 _p = ((POWER_BASIS * 12) - (s / (BASIS / (POWER_BASIS * 10)))) /
			2;
		uint256 p = _p / POWER_BASIS;
		uint256 rp = p + 1;
		uint256 f = _p - (p * POWER_BASIS);
		uint256 d1 = _d;
		uint256 d2 = _d;
		for (uint256 i = 0; i < p; i++) {
			d1 = (d1 * _d) / BASIS;
		}
		for (uint256 i = 0; i < rp; i++) {
			d2 = (d2 * _d) / BASIS;
		}
		uint256 g = ((d1 - d2) * f) / POWER_BASIS;
		uint256 d = d1 - g;
		uint256 mint = max * d;
		mint = mint / BASIS / BASIS;
		return mint;
	}
}
