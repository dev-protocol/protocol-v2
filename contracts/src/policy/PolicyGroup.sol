pragma solidity 0.5.17;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {UsingRegistry} from "contracts/src/common/registry/UsingRegistry.sol";
import {UsingStorage} from "contracts/src/common/storage/UsingStorage.sol";
import {IPolicyGroup} from "contracts/interface/IPolicyGroup.sol";
import {IPolicy} from "contracts/interface/IPolicy.sol";

contract PolicyGroup is UsingRegistry, UsingStorage, IPolicyGroup {
	using SafeMath for uint256;

	constructor(address _registry) public UsingRegistry(_registry) {}

	function addGroup(address _addr) external {
		require(
			msg.sender == registry().registries("PolicyFactory"),
			"this is illegal address"
		);
		bytes32 key = getGroupKey(_addr);
		require(eternalStorage().getBool(key) == false, "already group");
		eternalStorage().setBool(key, true);
		setVotingEndBlockNumber(_addr);
	}

	function isGroup(address _addr) external view returns (bool) {
		return eternalStorage().getBool(getGroupKey(_addr));
	}

	function isDuringVotingPeriod(address _policy)
		external
		view
		returns (bool)
	{
		bytes32 key = getVotingEndBlockNumberKey(_policy);
		uint256 votingEndBlockNumber = eternalStorage().getUint(key);
		return block.number < votingEndBlockNumber;
	}

	function setVotingEndBlockNumber(address _policy) private {
		require(
			msg.sender == registry().registries("PolicyFactory"),
			"this is illegal address"
		);
		bytes32 key = getVotingEndBlockNumberKey(_policy);
		uint256 tmp = IPolicy(registry().registries("Policy")).policyVotingBlocks();
		uint256 votingEndBlockNumber = block.number.add(tmp);
		eternalStorage().setUint(key, votingEndBlockNumber);
	}

	function getVotingEndBlockNumberKey(address _policy)
		private
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked("_votingEndBlockNumber", _policy));
	}

	function getGroupKey(address _addr) private pure returns (bytes32) {
		return keccak256(abi.encodePacked("_group", _addr));
	}
}
