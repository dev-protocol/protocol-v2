// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IWithdraw {
	event PropertyTransfer(
		address indexed _property,
		address _from,
		address _to
	);

	function initialize(address _registry) external;

	function withdraw(address _property) external;

	function beforeBalanceChange(address _from, address _to) external;

	function calculateRewardAmount(address _property, address _user)
		external
		view
		returns (
			uint256 _amount,
			uint256 _price,
			uint256 _cap,
			uint256 _allReward
		);
}
