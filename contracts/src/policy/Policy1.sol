// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interface/IPolicy.sol";
import "../common/libs/Curve.sol";
import "../common/registry/UsingRegistry.sol";

contract Policy1 is IPolicy, Ownable, Curve, UsingRegistry {
	uint256 public override marketVotingSeconds = 86400 * 5;
	uint256 public override policyVotingSeconds = 86400 * 5;
	uint256 private constant MINT_PER_SECOND_AND_ASSET = 132000000000000 / 15;

	constructor(address _registry) UsingRegistry(_registry) {}

	function rewards(uint256 _lockups, uint256 _assets)
		external
		view
		virtual
		override
		returns (uint256)
	{
		uint256 totalSupply = IERC20(registry().registries("Dev"))
			.totalSupply();
		return
			curveRewards(
				_lockups,
				_assets,
				totalSupply,
				MINT_PER_SECOND_AND_ASSET
			);
	}

	function holdersShare(uint256 _reward, uint256 _lockups)
		external
		view
		virtual
		override
		returns (uint256)
	{
		return _lockups > 0 ? (_reward * 51) / 100 : _reward;
	}

	function authenticationFee(uint256 _assets, uint256 _propertyAssets)
		external
		view
		virtual
		override
		returns (uint256)
	{
		uint256 a = _assets / 10000;
		uint256 b = _propertyAssets / 100000000000000000000000;
		if (a <= b) {
			return 0;
		}
		return a - b;
	}

	function shareOfTreasury(uint256 _supply)
		external
		pure
		override
		returns (uint256)
	{
		return (_supply / 100) * 5;
	}
}
