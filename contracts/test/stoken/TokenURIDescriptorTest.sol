// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/ITokenURIDescriptor.sol";

contract TokenURIDescriptorTest is ITokenURIDescriptor {
	function image(
		uint256,
		address,
		ISTokensManager.StakingPositions memory,
		ISTokensManager.Rewards memory
	) external pure override returns (string memory) {
		return "dummy-string";
	}
}
