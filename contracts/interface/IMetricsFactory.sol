// SPDX-License-Identifier: MPL-2.0
pragma solidity = 0.8.6;

interface IMetricsFactory {
	function create(address _property) external returns (address);

	function destroy(address _metrics) external;
}
