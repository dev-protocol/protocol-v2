// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IAddressRegistry {
	function setRegistry(string memory _key, address _addr) external;

	function registries(string memory _key) external view returns (address);
}
