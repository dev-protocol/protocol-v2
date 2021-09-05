// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IPolicyFactory {
	function create(address _newPolicyAddress) external;

	function forceAttach(address _policy) external;
}
