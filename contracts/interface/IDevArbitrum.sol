// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IDevArbitrum {
	event BridgeMint(address indexed _account, uint256 _amount);
	event BridgeBurn(address indexed _account, uint256 _amount);
	event TxToL1(address indexed _from, uint256 indexed _id, bytes _data);
	event L1EscrowMint(address _token, uint256 _id, uint256 _amount);
}
