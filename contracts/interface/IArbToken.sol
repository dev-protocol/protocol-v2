// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

// see
// https://github.com/OffchainLabs/arbitrum/blob/master/packages/arb-bridge-peripherals/contracts/tokenbridge/arbitrum/IArbToken.sol
// It was written in version 0.6.11, so it was created to support 0.8.

interface IArbToken {
	/**
	 * @notice should increase token supply by amount, and should (probably) only be callable by the L1 bridge.
	 */
	function bridgeMint(address _account, uint256 _amount) external;

	/**
	 * @notice should decrease token supply by amount, and should (probably) only be callable by the L1 bridge.
	 */
	function bridgeBurn(address _account, uint256 _amount) external;

	/**
	 * @return address of layer 1 token
	 */
	function l1Address() external view returns (address);
}
