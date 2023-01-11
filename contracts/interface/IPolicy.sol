// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IPolicy {
	function rewards(
		uint256 _lockups,
		uint256 _assets
	) external view returns (uint256);

	function holdersShare(
		uint256 _amount,
		uint256 _lockups
	) external view returns (uint256);

	function authenticationFee(
		uint256 _assets,
		uint256 _propertyAssets
	) external view returns (uint256);

	function marketVotingSeconds() external view returns (uint256);

	function policyVotingSeconds() external view returns (uint256);

	function shareOfTreasury(uint256 _supply) external view returns (uint256);
}
