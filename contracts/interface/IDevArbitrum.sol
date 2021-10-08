// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDevArbitrum {
	event BridgeMint(address indexed account, uint256 amount);
	event BridgeBurn(address indexed account, uint256 amount);
	event L1EscrowMint(address token, uint256 id, uint256 amount);
}
