// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../interface/IPropertyFactory.sol";
import "../../interface/IMarket.sol";
import "../common/registry/InitializableUsingRegistry.sol";
import "./Property.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * A factory contract that creates a new Property contract.
 */
contract PropertyFactory is InitializableUsingRegistry, IPropertyFactory {
	mapping(address => bool) public override isProperty;
	mapping(address => EnumerableSet.AddressSet) private addressesMapOfAuthor;

	using EnumerableSet for EnumerableSet.AddressSet;
	address private property;

	/**
	 * @dev Initialize the passed address as AddressRegistry address.
	 * @param _registry AddressRegistry address.
	 */
	function initialize(address _registry) external initializer {
		__UsingRegistry_init(_registry);
		property = address(new Property());
	}

	/**
	 * @dev Creates a new Property contract.
	 * @param _name Name of the new Property.
	 * @param _symbol Symbol of the new Property.
	 * @param _author Author address of the new Property.
	 * @return Address of the new Property.
	 */
	function create(
		string memory _name,
		string memory _symbol,
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
	 * @param _args arguments to pass through to Market.
	 * @return The transaction fail/success.
	 */
	function createAndAuthenticate(
		string memory _name,
		string memory _symbol,
		address _market,
		string[] memory _args
	) external override returns (bool) {
		return
			IMarket(_market).authenticateFromPropertyFactory(
				_create(_name, _symbol, msg.sender),
				msg.sender,
				_args
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
		address propertyAddr = Clones.clone(property);
		Property(propertyAddr).initialize(
			address(registry()),
			_author,
			_name,
			_symbol
		);

		/**
		 * Adds the new Property contract to the Property address set.
		 */
		isProperty[propertyAddr] = true;

		emit Create(msg.sender, propertyAddr);
		addressesMapOfAuthor[_author].add(propertyAddr);
		return propertyAddr;
	}

	/**
	 * @dev get property address list by author
	 * @param _author property author
	 * @return property address list by author.
	 */
	function getPropertiesOfAuthor(address _author)
		external
		view
		override
		returns (address[] memory)
	{
		return addressesMapOfAuthor[_author].values();
	}

	/**
	 * @dev Set the propety address to an internal variable
	 * @param _property property address
	 * deprecated TODO V3
	 */
	function setPropertyAddress(address _property) external override {
		require(isProperty[_property], "not property");
		Property p = Property(_property);
		address author = p.author();
		require(
			addressesMapOfAuthor[author].contains(_property) == false,
			"already set"
		);
		addressesMapOfAuthor[author].add(_property);
	}
}
