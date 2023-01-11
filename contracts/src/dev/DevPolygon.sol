// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../../interface/IDevPolygon.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./Dev.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract DevPolygon is Dev, IDevPolygon, InitializableUsingRegistry {
	// ROLE
	bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

	/**
	 * Initialize the passed address as AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
		__Dev_init("Dev Polygon");
		_setupRole(DEPOSITOR_ROLE, _msgSender());
	}

	/**
	 * @notice called when token is deposited on root chain
	 * @dev Should be callable only by ChildChainManager
	 * Should handle deposit by minting the required amount for user
	 * Make sure minting is done only by this function
	 * @param user user address for whom deposit is being done
	 * @param depositData abi encoded amount
	 */
	function deposit(
		address user,
		bytes calldata depositData
	) external override onlyRole(DEPOSITOR_ROLE) {
		uint256 amount = abi.decode(depositData, (uint256));
		_mint(user, amount);
	}

	/**
	 * @notice called when user wants to withdraw tokens back to root chain
	 * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
	 * @param amount amount of tokens to withdraw
	 */
	function withdraw(uint256 amount) external {
		_burn(_msgSender(), amount);
	}
}
