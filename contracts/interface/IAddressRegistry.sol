// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

interface IAddressRegistry {
	function initialize() external;

	function setRegistry(string calldata _key, address _addr) external;

	function registries(string calldata _key) external view returns (address);
}
