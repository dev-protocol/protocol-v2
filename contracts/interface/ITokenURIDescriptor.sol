// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

import "./ISTokensManager.sol";

interface ITokenURIDescriptor {
	/*
	 * @dev get image from custom descriopro
	 * @param _tokenId token id
	 * @param _owner owner address
	 * @param _positions staking position
	 * @param _rewards rewards
	 * @param _payload token payload
	 * @return string image information
	 */
	function image(
		uint256 _tokenId,
		address _owner,
		ISTokensManager.StakingPositions memory _positions,
		ISTokensManager.Rewards memory _rewards,
		bytes32 _payload
	) external view returns (string memory);

	/*
	 * @dev hooks and run a side-effect before minted
	 * @param _tokenId token id
	 * @param _owner owner address
	 * @param _positions staking position
	 * @param _payload token payload
	 * @return bool success or failure
	 */
	function onBeforeMint(
		uint256 _tokenId,
		address _owner,
		ISTokensManager.StakingPositions memory _positions,
		bytes32 _payload
	) external returns (bool);
}
