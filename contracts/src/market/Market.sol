// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../interface/IProperty.sol";
import "../../interface/IMarket.sol";
import "../../interface/IMarketBehavior.sol";
import "../../interface/IPolicy.sol";
import "../../interface/IMetrics.sol";
import "../../interface/IMetricsFactory.sol";
import "../../interface/ILockup.sol";
import "../../interface/IDev.sol";
import "../../interface/IDevBridge.sol";
import "../common/registry/UsingRegistry.sol";

/**
 * A user-proposable contract for authenticating and associating assets with Property.
 * A user deploys a contract that inherits IMarketBehavior and creates this Market contract with the MarketFactory contract.
 */
contract Market is UsingRegistry, IMarket {
	EnumerableSet.AddressSet private authenticatedProperties;
	bool public override enabled;
	address public override behavior;
	uint256 public override votingEndTimestamp;
	mapping(bytes32 => bool) private idMap;
	mapping(address => bytes32) private idHashMetricsMap;

	using EnumerableSet for EnumerableSet.AddressSet;

	/**
	 * Initialize the passed address as AddressRegistry address and user-proposed contract.
	 */
	constructor(address _registry, address _behavior) UsingRegistry(_registry) {
		/**
		 * Validates the sender is MarketFactory contract.
		 */
		require(
			msg.sender == registry().registries("MarketFactory"),
			"this is illegal address"
		);

		/**
		 * Stores the contract address proposed by a user as an internal variable.
		 */
		behavior = _behavior;

		/**
		 * By default this contract is disabled.
		 */
		enabled = false;

		/**
		 * Sets the period during which voting by voters can be accepted.
		 * This period is determined by `Policy.marketVotingSeconds`.
		 */
		uint256 marketVotingSeconds = IPolicy(registry().registries("Policy"))
			.marketVotingSeconds();
		votingEndTimestamp = block.timestamp + marketVotingSeconds;
	}

	/**
	 * Validates the sender is the passed Property's author.
	 */
	function propertyValidation(address _prop) private view {
		require(
			msg.sender == IProperty(_prop).author(),
			"this is illegal address"
		);
		require(enabled, "market is not enabled");
	}

	/**
	 * Modifier for validates the sender is the passed Property's author.
	 */
	modifier onlyPropertyAuthor(address _prop) {
		propertyValidation(_prop);
		_;
	}

	/**
	 * Modifier for validates the sender is the author of the Property associated with the passed Metrics contract.
	 */
	modifier onlyLinkedPropertyAuthor(address _metrics) {
		address _prop = IMetrics(_metrics).property();
		propertyValidation(_prop);
		_;
	}

	/**
	 * Activates this Market.
	 * Called from MarketFactory contract.
	 */
	function toEnable() external override {
		require(
			msg.sender == registry().registries("MarketFactory"),
			"this is illegal address"
		);
		require(isDuringVotingPeriod(), "deadline is over");
		enabled = true;
	}

	/**
	 * deactivates this Market.
	 * Called from MarketFactory contract.
	 */
	function toDisable() external override {
		require(
			msg.sender == registry().registries("MarketFactory"),
			"this is illegal address"
		);
		enabled = false;
	}

	/**
	 * Authenticates the new asset and proves that the Property author is the owner of the asset.
	 */
	function authenticate(address _prop, string[] memory _args)
		public
		override
		onlyPropertyAuthor(_prop)
		returns (bool)
	{
		return _authenticate(_prop, msg.sender, _args);
	}

	/**
	 * Authenticates the new asset and proves that the Property author is the owner of the asset.
	 */
	function authenticateFromPropertyFactory(
		address _prop,
		address _author,
		string[] memory _args
	) external override returns (bool) {
		/**
		 * Validates the sender is PropertyFactory.
		 */
		require(
			msg.sender == registry().registries("PropertyFactory"),
			"this is illegal address"
		);

		/**
		 * Validates this Market is already enabled..
		 */
		require(enabled, "market is not enabled");

		return _authenticate(_prop, _author, _args);
	}

	/**
	 * Bypass to IMarketBehavior.authenticate.
	 * Authenticates the new asset and proves that the Property author is the owner of the asset.
	 */
	function _authenticate(
		address _prop,
		address _author,
		string[] memory _args
	) private returns (bool) {
		return IMarketBehavior(behavior).authenticate(_prop, _args, _author);
	}

	/**
	 * Returns the authentication fee.
	 * Calculates by gets the staking amount of the Property to be authenticated
	 * and the total number of authenticated assets on the protocol, and calling `Policy.authenticationFee`.
	 */
	function getAuthenticationFee(address _property)
		private
		view
		returns (uint256)
	{
		uint256 tokenValue = ILockup(registry().registries("Lockup"))
			.totalLockedForProperty(_property);
		IPolicy policy = IPolicy(registry().registries("Policy"));
		IMetricsFactory metricsFactory = IMetricsFactory(
			registry().registries("MetricsFactory")
		);
		return
			policy.authenticationFee(metricsFactory.metricsCount(), tokenValue);
	}

	/**
	 * A function that will be called back when the asset is successfully authenticated.
	 * There are cases where oracle is required for the authentication process, so the function is used callback style.
	 */
	function authenticatedCallback(address _property, bytes32 _idHash)
		external
		override
		returns (address)
	{
		/**
		 * Validates the sender is the saved IMarketBehavior address.
		 */
		require(msg.sender == behavior, "this is illegal address");
		require(enabled, "market is not enabled");

		/**
		 * Validates the assets are not double authenticated.
		 */
		require(idMap[_idHash] == false, "id is duplicated");
		idMap[_idHash] = true;

		/**
		 * Gets the Property author address.
		 */
		address sender = IProperty(_property).author();

		/**
		 * Publishes a new Metrics contract and associate the Property with the asset.
		 */
		IMetricsFactory metricsFactory = IMetricsFactory(
			registry().registries("MetricsFactory")
		);
		address metrics = metricsFactory.create(_property);
		idHashMetricsMap[metrics] = _idHash;

		/**
		 * Burn as a authentication fee.
		 */
		uint256 authenticationFee = getAuthenticationFee(_property);
		require(
			IDevBridge(registry().registries("DevBridge")).burn(
				sender,
				authenticationFee
			),
			"dev fee failed"
		);

		/**
		 * Adds the number of authenticated assets in this Market.
		 */
		authenticatedProperties.add(_property);
		return metrics;
	}

	/**
	 * Release the authenticated asset.
	 */
	function deauthenticate(address _metrics)
		external
		override
		onlyLinkedPropertyAuthor(_metrics)
	{
		/**
		 * Validates the passed Metrics address is authenticated in this Market.
		 */
		bytes32 idHash = idHashMetricsMap[_metrics];
		require(idMap[idHash], "not authenticated");

		/**
		 * Removes the authentication status from local variables.
		 */
		idMap[idHash] = false;
		idHashMetricsMap[_metrics] = bytes32(0);

		/**
		 * Removes the passed Metrics contract from the Metrics address set.
		 */
		IMetricsFactory metricsFactory = IMetricsFactory(
			registry().registries("MetricsFactory")
		);
		metricsFactory.destroy(_metrics);

		/**
		 * Subtracts the number of authenticated assets in this Market.
		 */
		address property = IMetrics(_metrics).property();
		authenticatedProperties.remove(property);
	}

	/**
	 * Bypass to IMarketBehavior.name.
	 */
	function name() external view override returns (string memory) {
		return IMarketBehavior(behavior).name();
	}

	/**
	 * Bypass to IMarketBehavior.schema.
	 */
	function schema() external view override returns (string memory) {
		return IMarketBehavior(behavior).schema();
	}

	/**
	 * get issued metrics count
	 */
	function issuedMetrics() external view returns (uint256) {
		return authenticatedProperties.length();
	}

	/**
	 * get authentivated properties
	 */
	function getAuthenticatedProperties()
		external
		view
		returns (address[] memory)
	{
		return authenticatedProperties.values();
	}

	function isDuringVotingPeriod() private view returns (bool) {
		return block.timestamp < votingEndTimestamp;
	}
}
