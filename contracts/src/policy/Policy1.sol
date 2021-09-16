// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Curve} from "contracts/src/common/libs/Curve.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {IPolicy} from "contracts/interface/IPolicy.sol";

contract Policy1 is IPolicy, Ownable, Curve, UsingRegistry {
	using SafeMath for uint256;
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
		return _lockups > 0 ? (_reward.mul(51)).div(100) : _reward;
	}

	function authenticationFee(uint256 _assets, uint256 _propertyAssets)
		external
		view
		virtual
		override
		returns (uint256)
	{
		uint256 a = _assets.div(10000);
		uint256 b = _propertyAssets.div(100000000000000000000000);
		if (a <= b) {
			return 0;
		}
		return a.sub(b);
	}

	function shareOfTreasury(uint256 _supply)
		external
		pure
		override
		returns (uint256)
	{
		return _supply.div(100).mul(5);
	}
}
