// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IAddressRegistry {
	function setRegistry(string calldata _key, address _addr) external;

	function registries(string calldata _key) external view returns (address);
}
