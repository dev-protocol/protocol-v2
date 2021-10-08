// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IArbSys} from "contracts/interface/IArbSys.sol";
import {IArbitrumMessenger} from "contracts/interface/IArbitrumMessenger.sol";

abstract contract ArbitrumMessenger is IArbitrumMessenger, Initializable {
	Counters.Counter private tokenIdCounter;
	address public arbSys;

	using Counters for Counters.Counter;

	// solhint-disable-next-line func-name-mixedcase
	function __ArbitrumMessenger_init(address _arbSys) public initializer {
		arbSys = _arbSys;
	}

	function sendTxToL1(
		address _from,
		address _to,
		bytes memory _data
	) internal virtual returns (uint256) {
		tokenIdCounter.increment();
		uint256 id = tokenIdCounter.current();
		IArbSys(arbSys).sendTxToL1(_to, _data);
		emit TxToL1(_from, _to, id, _data);
		return id;
	}
}
