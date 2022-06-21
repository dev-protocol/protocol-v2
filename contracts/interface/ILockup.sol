// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface ILockup {
	struct RewardPrices {
		uint256 reward;
		uint256 holders;
		uint256 interest;
		uint256 holdersCap;
	}

	struct LockedupProperty {
		address property;
		uint256 value;
	}

	event Lockedup(
		address indexed _from,
		address indexed _property,
		uint256 _value,
		uint256 _tokenId
	);
	event Withdrew(
		address indexed _from,
		address indexed _property,
		uint256 _value,
		uint256 _reward,
		uint256 _tokenId
	);

	event UpdateCap(uint256 _cap);

	function depositToProperty(address _property, uint256 _amount)
		external
		returns (uint256);

	function gatedDepositToProperty(
		address _property,
		uint256 _amount,
		address _gatewayAddress,
		uint256 _gatewayFee
	) external returns (uint256);

	function depositToPosition(uint256 _tokenId, uint256 _amount)
		external
		returns (bool);

	function getLockedupProperties()
		external
		view
		returns (LockedupProperty[] memory);

	function update() external;

	function withdrawByPosition(
		uint256 _tokenId,
		uint256 _amount,
		address _gatewayAddress,
		uint256 _gatewayBasisFee
	) external returns (bool);

	function withdrawByPosition(uint256 _tokenId, uint256 _amount)
		external
		returns (bool);

	function calculateCumulativeRewardPrices()
		external
		view
		returns (
			uint256 _reward,
			uint256 _holders,
			uint256 _interest,
			uint256 _holdersCap
		);

	function calculateRewardAmount(address _property)
		external
		view
		returns (uint256, uint256);

	function totalLockedForProperty(address _property)
		external
		view
		returns (uint256);

	function totalLocked() external view returns (uint256);

	function calculateWithdrawableInterestAmountByPosition(uint256 _tokenId)
		external
		view
		returns (uint256);

	function cap() external view returns (uint256);

	function updateCap(uint256 _cap) external;
}
