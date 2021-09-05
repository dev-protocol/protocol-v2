/* solhint-disable const-name-snakecase */
// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TreasuryFee} from "contracts/src/policy/TreasuryFee.sol";

contract Patch780 is TreasuryFee {
	uint256 private constant mint_per_block_and_aseet = 132000000000000;

	constructor(address _registry) TreasuryFee(_registry) {}

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
				mint_per_block_and_aseet
			);
	}
}
