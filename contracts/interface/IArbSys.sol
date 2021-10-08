// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

// see https://github.com/hop-exchange/contracts/blob/master/contracts/interfaces/arbitrum/messengers/IArbSys.sol
interface IArbSys {
    // Get ArbOS version number
    function arbOSVersion() external pure returns (uint);

    // Send given amount of Eth to dest with from sender.
    function withdrawEth(address dest) external payable;

    // Send a transaction to L1
    function sendTxToL1(address destAddr, bytes calldata calldataForL1) external payable;

    // Return the number of transactions issued by the given external account
    // or the account sequence number of the given contract
    function getTransactionCount(address account) external view returns(uint256);

    event EthWithdrawal(address indexed destAddr, uint amount);
    event ERC20Withdrawal(address indexed destAddr, address indexed tokenAddr, uint amount);
    event ERC721Withdrawal(address indexed destAddr, address indexed tokenAddr, uint indexed id);
}
