// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {Property} from "contracts/src/property/Property.sol";
import {IPropertyGroup} from "contracts/interface/IPropertyGroup.sol";
import {IPropertyFactory} from "contracts/interface/IPropertyFactory.sol";
import {IMarket} from "contracts/interface/IMarket.sol";

/**
 * A factory contract that creates a new Property contract.
 */
contract PropertyFactory is UsingRegistry, IPropertyFactory {
	/**
	 * @dev Initialize the passed address as AddressRegistry address.
	 * @param _registry AddressRegistry address.
	 */
	constructor(address _registry) UsingRegistry(_registry) {}

	/**
	 * @dev Creates a new Property contract.
	 * @param _name Name of the new Property.
	 * @param _symbol Symbol of the new Property.
	 * @param _author Author address of the new Property.
	 * @return Address of the new Property.
	 */
	function create(
		string calldata _name,
		string calldata _symbol,
		address _author
	) external override returns (address) {
		return _create(_name, _symbol, _author);
	}

	/**
	 * @dev Creates a new Property contract and authenticate.
	 * There are too many local variables, so when using this method limit the number of arguments that can be used to authenticate to a maximum of 3.
	 * @param _name Name of the new Property.
	 * @param _symbol Symbol of the new Property.
	 * @param _market Address of a Market.
	 * @param _args1 First argument to pass through to Market.
	 * @param _args2 Second argument to pass through to Market.
	 * @param _args3 Third argument to pass through to Market.
	 * @return The transaction fail/success.
	 */
	function createAndAuthenticate(
		string calldata _name,
		string calldata _symbol,
		address _market,
		string calldata _args1,
		string calldata _args2,
		string calldata _args3
	) external override returns (bool) {
		return
			IMarket(_market).authenticateFromPropertyFactory(
				_create(_name, _symbol, msg.sender),
				msg.sender,
				_args1,
				_args2,
				_args3,
				"",
				""
			);
	}

	/**
	 * @dev Creates a new Property contract.
	 * @param _name Name of the new Property.
	 * @param _symbol Symbol of the new Property.
	 * @param _author Author address of the new Property.
	 * @return Address of the new Property.
	 */
	function _create(
		string memory _name,
		string memory _symbol,
		address _author
	) private returns (address) {
		/**
		 * Creates a new Property contract.
		 */
		Property property = new Property(
			address(registry()),
			_author,
			_name,
			_symbol
		);

		/**
		 * Adds the new Property contract to the Property address set.
		 */
		IPropertyGroup(registry().registries("PropertyGroup")).addGroup(
			address(property)
		);

		emit Create(msg.sender, address(property));
		return address(property);
	}
}
