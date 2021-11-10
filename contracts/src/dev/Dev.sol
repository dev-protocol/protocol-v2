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
	/**
	 * Initialize the passed address as AddressRegistry address.
	 * The token name is `Dev`, the token symbol is `DEV`, and the decimals is 18.
	 */
	// solhint-disable-next-line func-name-mixedcase
	function __Dev_init(string memory _devName) public initializer {
		__ERC20_init(_devName, "DEV");
		__AccessControlEnumerable_init();
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
	}

	function mint(address _account, uint256 _amount) public override {
		_mint(_account, _amount);
	}

	function burn(address _account, uint256 _amount) public override {
		_burn(_account, _amount);
	}
}
