// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../interface/IWithdraw.sol";
import "../../interface/IProperty.sol";
import "../../interface/IPropertyFactory.sol";
import "../../interface/IPolicy.sol";
import "../common/registry/UsingRegistry.sol";

/**
 * A contract that represents the assets of the user and collects staking from the stakers.
 * Property contract inherits ERC20.
 * Holders of Property contracts(tokens) receive holder rewards according to their share.
 */
contract Property is ERC20, UsingRegistry, IProperty {
	uint8 private constant PROPERTY_DECIMALS = 18;
	uint8 private __decimals;
	uint256 private constant SUPPLY = 10000000000000000000000000;
	address private __author;
	string private __name;
	string private __symbol;
	EnumerableSet.AddressSet private holders;

	using EnumerableSet for EnumerableSet.AddressSet;

	/**
	 * @dev Initializes the passed value as AddressRegistry address, author address, token name, and token symbol.
	 * @param _registry AddressRegistry address.
	 * @param _own The author address.
	 * @param _name The name of the new Property.
	 * @param _symbol The symbol of the new Property.
	 */
	constructor(
		address _registry,
		address _own,
		string memory _name,
		string memory _symbol
	) ERC20(_name, _symbol) UsingRegistry(_registry) {
		/**
		 * Validates the sender is PropertyFactory contract.
		 */
		require(
			msg.sender == registry().registries("PropertyFactory"),
			"this is illegal address"
		);
		/**
		 * Sets the author.
		 */
		__author = _own;

		/**
		 * Sets the ERO20 attributes
		 */
		__name = _name;
		__symbol = _symbol;
		__decimals = PROPERTY_DECIMALS;

		/**
		 * Mints to the author and  treasury contract.
		 */
		IPolicy policy = IPolicy(registry().registries("Policy"));
		uint256 toTreasury = policy.shareOfTreasury(SUPPLY);
		uint256 toAuthor = SUPPLY - toTreasury;
		require(toAuthor != 0, "share of author is 0");
		_mint(__author, toAuthor);
		_mint(registry().registries("Treasury"), toTreasury);
	}

	/**
	 * @dev Throws if called by any account other than the author.
	 */
	modifier onlyAuthor() {
		require(msg.sender == __author, "illegal sender");
		_;
	}

	/**
	 * @dev Returns the name of the author.
	 * @return The the author address.
	 */
	function author() external view override returns (address) {
		return __author;
	}

	/**
	 * @dev Returns the name of the token.
	 * @return The name of the token.
	 */
	function name() public view override returns (string memory) {
		return __name;
	}

	/**
	 * @dev Returns the symbol of the token, usually a shorter version of the name.
	 * @return The symbol of the token, usually a shorter version of the name.
	 */
	function symbol() public view override returns (string memory) {
		return __symbol;
	}

	/**
	 * @dev Returns the number of decimals used to get its user representation.
	 * For example, if `decimals` equals `2`, a balance of `505` tokens should
	 * be displayed to a user as `5,05` (`505 / 10 ** 2`).
	 *
	 * Tokens usually opt for a value of 18, imitating the relationship between
	 * Ether and Wei.
	 *
	 * NOTE: This information is only used for _display_ purposes: it in
	 * no way affects any of the arithmetic of the contract, including
	 * {IERC20-balanceOf} and {IERC20-transfer}.
	 * @return The number of decimals used to get its user representation.
	 */
	function decimals() public view override returns (uint8) {
		return __decimals;
	}

	/**
	 * @dev Changes the name.
	 * @param _name The new name.
	 */
	function changeName(string memory _name) external override onlyAuthor {
		emit ChangeName(__name, _name);

		__name = _name;
	}

	/**
	 * @dev Changes the symbol.
	 * @param _symbol The new symbol.
	 */
	function changeSymbol(string memory _symbol) external override onlyAuthor {
		emit ChangeSymbol(__symbol, _symbol);

		__symbol = _symbol;
	}

	/**
	 * @dev Hook on `transfer` and call `Withdraw.beforeBalanceChange` function.
	 * @param _to The recipient address.
	 * @param _value The transfer amount.
	 */
	function transfer(address _to, uint256 _value)
		public
		override
		returns (bool)
	{
		/**
		 * Validates the destination is not 0 address.
		 */
		require(_to != address(0), "this is illegal address");
		require(_value != 0, "illegal transfer value");

		/**
		 * Calls Withdraw contract via Allocator contract.
		 * Passing through the Allocator contract is due to the historical reason for the old Property contract.
		 */
		IWithdraw(registry().registries("Withdraw")).beforeBalanceChange(
			msg.sender,
			_to
		);

		/**
		 * Calls the transfer of ERC20.
		 */
		_transfer(msg.sender, _to, _value);
		return true;
	}

	/**
	 * @dev Hook on `transferFrom` and call `Withdraw.beforeBalanceChange` function.
	 * @param _from The source address.
	 * @param _to The recipient address.
	 * @param _value The transfer amount.
	 */
	function transferFrom(
		address _from,
		address _to,
		uint256 _value
	) public override returns (bool) {
		/**
		 * Validates the source and destination is not 0 address.
		 */
		require(_from != address(0), "this is illegal address");
		require(_to != address(0), "this is illegal address");
		require(_value != 0, "illegal transfer value");

		/**
		 * Calls Withdraw contract via Allocator contract.
		 * Passing through the Allocator contract is due to the historical reason for the old Property contract.
		 */
		IWithdraw(registry().registries("Withdraw")).beforeBalanceChange(
			_from,
			_to
		);

		/**
		 * Calls the transfer of ERC20.
		 */
		_transfer(_from, _to, _value);

		/**
		 * Reduces the allowance amount.
		 */
		uint256 allowanceAmount = allowance(_from, msg.sender);
		_approve(_from, msg.sender, allowanceAmount - _value);
		return true;
	}

	/**
	 * @dev Transfers the staking amount to the original owner.
	 * @param _sender The Property Contract address as the source.
	 * @param _value The transfer amount.
	 */
	function withdraw(address _sender, uint256 _value) external override {
		/**
		 * Validates the sender is Lockup contract.
		 */
		require(
			msg.sender == registry().registries("Lockup"),
			"this is illegal address"
		);

		/**
		 * Transfers the passed amount to the original owner.
		 */
		ERC20 devToken = ERC20(registry().registries("Dev"));
		bool result = devToken.transfer(_sender, _value);
		require(result, "dev transfer failed");
	}

	/**
	 * @dev Get the holder and its balance
	 * @return holder and its balance
	 */
	function getBalances()
		external
		view
		override
		returns (PropertyBalance[] memory)
	{
		uint256 holderCount = holders.length();
		PropertyBalance[] memory results = new PropertyBalance[](holderCount);
		for (uint256 i = 0; i < holderCount; i++) {
			address holder = holders.at(i);
			uint256 balance = balanceOf(holder);
			results[i] = PropertyBalance(holder, balance);
		}
		return results;
	}

	/**
	 * @dev set folder information
	 * @param _from sender of the token
	 * @param _to where to send the token
	 * @param _amount amount of tokens sent
	 */
	function _afterTokenTransfer(
		address _from,
		address _to,
		uint256 _amount
	) internal virtual override {
		super._afterTokenTransfer(_from, _to, _amount);
		// not burned
		holders.add(_to);
	}
}
