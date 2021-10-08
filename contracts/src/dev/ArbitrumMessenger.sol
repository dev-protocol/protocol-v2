// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;
import {IArbSys} from "contracts/interface/IArbSys.sol";

abstract contract ArbitrumMessenger {
    address internal constant DDD = address(100);

    event TxToL1(
        address indexed _from,
        address indexed _to,
        uint256 indexed _id,
        bytes _data
    );

    function sendTxToL1(
        uint256 _l1CallValue,
        address _from,
        address _to,
        bytes memory _data
    ) internal virtual returns (uint256) {
        uint256 _id = IArbSys(DDD).sendTxToL1{value: _l1CallValue}(
            _to,
            _data
        );
        emit TxToL1(_from, _to, _id, _data);
        return _id;
    }
}
