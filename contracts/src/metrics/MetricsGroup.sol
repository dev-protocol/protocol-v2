// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

<<<<<<< HEAD
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
=======
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
>>>>>>> origin/main
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {UsingStorage} from "contracts/src/common/storage/UsingStorage.sol";
import {IMetrics} from "contracts/interface/IMetrics.sol";
import {IMetricsGroup} from "contracts/interface/IMetricsGroup.sol";

contract MetricsGroup is UsingRegistry, UsingStorage, IMetricsGroup {
	using SafeMath for uint256;

	constructor(address _registry) public UsingRegistry(_registry) {}

	function addGroup(address _addr) external {
		require(
			msg.sender == registry().registries("MetricsFactory"),
			"this is illegal address"
		);

		require(
			eternalStorage().getBool(getGroupKey(_addr)) == false,
			"already enabled"
		);
		eternalStorage().setBool(getGroupKey(_addr), true);
		address property = IMetrics(_addr).property();
		uint256 totalCount = eternalStorage().getUint(getTotalCountKey());
		uint256 metricsCountPerProperty = getMetricsCountPerProperty(property);
		if (metricsCountPerProperty == 0) {
			uint256 tmp = eternalStorage().getUint(
				getTotalAuthenticatedPropertiesKey()
			);
			setTotalAuthenticatedProperties(tmp.add(1));
		}
		totalCount = totalCount.add(1);
		metricsCountPerProperty = metricsCountPerProperty.add(1);
		setTotalIssuedMetrics(totalCount);
		setMetricsCountPerProperty(property, metricsCountPerProperty);
	}

	function removeGroup(address _addr) external {
		require(
			msg.sender == registry().registries("MetricsFactory"),
			"this is illegal address"
		);

		require(
			eternalStorage().getBool(getGroupKey(_addr)),
			"address is not group"
		);
		eternalStorage().setBool(getGroupKey(_addr), false);
		address property = IMetrics(_addr).property();
		uint256 totalCount = eternalStorage().getUint(getTotalCountKey());
		uint256 metricsCountPerProperty = getMetricsCountPerProperty(property);
		if (metricsCountPerProperty == 1) {
			uint256 tmp = eternalStorage().getUint(
				getTotalAuthenticatedPropertiesKey()
			);
			setTotalAuthenticatedProperties(tmp.sub(1));
		}
		totalCount = totalCount.sub(1);
		metricsCountPerProperty = metricsCountPerProperty.sub(1);
		setTotalIssuedMetrics(totalCount);
		setMetricsCountPerProperty(property, metricsCountPerProperty);
	}

	function isGroup(address _addr) external view returns (bool) {
		return eternalStorage().getBool(getGroupKey(_addr));
	}

	function totalIssuedMetrics() external view returns (uint256) {
		return eternalStorage().getUint(getTotalCountKey());
	}

	function totalAuthenticatedProperties() external view returns (uint256) {
		return eternalStorage().getUint(getTotalAuthenticatedPropertiesKey());
	}

	function hasAssets(address _property) external view returns (bool) {
		return getMetricsCountPerProperty(_property) > 0;
	}

	function getMetricsCountPerProperty(address _property)
		public
		view
		returns (uint256)
	{
		return
			eternalStorage().getUint(getMetricsCountPerPropertyKey(_property));
	}

	function setMetricsCountPerProperty(address _property, uint256 _value)
		internal
	{
		eternalStorage().setUint(
			getMetricsCountPerPropertyKey(_property),
			_value
		);
	}

	function setTotalIssuedMetrics(uint256 _value) private {
		eternalStorage().setUint(getTotalCountKey(), _value);
	}

	function setTotalAuthenticatedProperties(uint256 _value) private {
		eternalStorage().setUint(getTotalAuthenticatedPropertiesKey(), _value);
	}

	function getTotalCountKey() private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_totalCount"));
	}

	function getMetricsCountPerPropertyKey(address _property)
		private
		pure
		returns (bytes32)
	{
		return
			keccak256(abi.encodePacked("_metricsCountPerProperty", _property));
	}

	function getGroupKey(address _addr) private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_group", _addr));
	}

	function getTotalAuthenticatedPropertiesKey()
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_totalAuthenticatedProperties"));
	}
}
