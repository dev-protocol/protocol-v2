// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IArbitrumMessenger {
	event TxToL1(
		address indexed _from,
		address indexed _to,
		uint256 indexed _id,
		bytes _data
	);
}
