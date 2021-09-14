// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IMetrics {
	function market() external view returns (address);

	function property() external view returns (address);
}
