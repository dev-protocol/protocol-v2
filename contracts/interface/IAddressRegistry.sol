// SPDX-License-Identifier: MPL-2.0
pragma solidity = 0.8.6;

interface IAddressRegistry {
	function setRegistry(string calldata _key, address _addr) external;

	function registries(string calldata _key) external view returns (address);

	// TODO Solidity0.8にして、様子をみる
}
