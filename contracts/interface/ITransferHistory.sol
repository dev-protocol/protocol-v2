// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface ITransferHistory {
	struct TransferHistory {
		address to;
		address from;
		uint256 amount;
		uint256 sourceOfRecipient;
		uint256 sourceOfSender;
		bool fill;
		uint256 blockNumber;
	}

	function transferHistory(
		address _property,
		uint256 _index
	) external view returns (TransferHistory memory);

	function transferHistoryLength(
		address _property
	) external view returns (uint256);

	function transferHistorySender(
		address _property,
		address _sender,
		uint256 _index
	) external view returns (uint256);

	function transferHistoryRecipient(
		address _property,
		address _recipient,
		uint256 _index
	) external view returns (uint256);

	function transferHistorySenderLength(
		address _property,
		address _sender
	) external view returns (uint256);

	function transferHistoryRecipientLength(
		address _property,
		address _recipient
	) external view returns (uint256);
}
