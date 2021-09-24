// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.7;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {AccessControlEnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import {InitializableUsingRegistry} from "contracts/src/common/registry/InitializableUsingRegistry.sol";
import {IDev} from "contracts/interface/IDev.sol";
import {IArbToken} from "contracts/interface/IArbToken.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract Dev is
	ERC20Upgradeable,
	AccessControlEnumerableUpgradeable,
	IArbToken,
	InitializableUsingRegistry,
	IDev
{
	address public override l1Address;
	bytes32 public constant override BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 public constant override MINTER_ROLE = keccak256("MINTER_ROLE");

	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	function initialize(address _registry, address _l1DevAddress)
		external
		initializer
	{
		__ERC20_init("Dev", "DEV");
		__AccessControlEnumerable_init();
		__UsingRegistry_init(_registry);
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(BURNER_ROLE, _msgSender());
		_setupRole(MINTER_ROLE, _msgSender());
		l1Address = _l1DevAddress;
	}

	function bridgeMint(address account, uint256 amount) external override {
		this.mint(account, amount);
	}

	function bridgeBurn(address account, uint256 amount) external override {
		this.burn(account, amount);
	}

	function mint(address _account, uint256 _amount) external override {
		require(
			hasRole(MINTER_ROLE, _msgSender()),
			"must have minter role to mint"
		);
		_mint(_account, _amount);
	}

	function burn(address _account, uint256 _amount) external override {
		require(
			hasRole(BURNER_ROLE, _msgSender()),
			"must have burner role to burn"
		);
		_burn(_account, _amount);
	}
}
