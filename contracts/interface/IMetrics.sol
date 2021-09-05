// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.6;

interface IMetrics {
	function market() external view returns (address);

	function property() external view returns (address);
}
