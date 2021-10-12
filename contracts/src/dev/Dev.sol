// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "../../interface/IDev.sol";

/**
 * The contract used as the DEV token.
 * The DEV token is an ERC20 token used as the native token of the Dev Protocol.
 * The DEV token is created by migration from its predecessor, the MVP, legacy DEV token. For that reason, the initial supply is 0.
 * Also, mint will be performed based on the Allocator contract.
 * When authenticated a new asset by the Market contracts, DEV token is burned as fees.
 */
contract Dev is ERC20Upgradeable, AccessControlEnumerableUpgradeable, IDev {
	bytes32 public constant override BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 public constant override MINTER_ROLE = keccak256("MINTER_ROLE");

	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	// solhint-disable-next-line func-name-mixedcase
	function __Dev_init(string memory _devName) public initializer {
		__ERC20_init(_devName, "DEV");
		__AccessControlEnumerable_init();
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(BURNER_ROLE, _msgSender());
		_setupRole(MINTER_ROLE, _msgSender());
	}

	function mint(address _account, uint256 _amount) public override {
		require(
			hasRole(MINTER_ROLE, _msgSender()),
			"must have minter role to mint"
		);
		_mint(_account, _amount);
	}

	function burn(address _account, uint256 _amount) public override {
		require(
			hasRole(BURNER_ROLE, _msgSender()),
			"must have burner role to burn"
		);
		_burn(_account, _amount);
	}
}
