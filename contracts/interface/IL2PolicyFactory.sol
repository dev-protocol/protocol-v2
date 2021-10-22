// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IL2PolicyFactory {
	event Create(address indexed _from, address _policy);

	function create(address _newPolicyAddress) external;

	function forceAttach(address _policy) external;

	function isPotentialPolicy(address _addr) external view returns (bool);

	function closeVoteAt(address _addr) external view returns (uint256);

	function isDuringVotingPeriod(address _policy) external view returns (bool);
}
