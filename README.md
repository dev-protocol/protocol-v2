![Dev Protocol](https://raw.githubusercontent.com/dev-protocol/protocol-v2/main/public/asset/logo.png)

[![CI Status](https://github.com/dev-protocol/protocol-v2/workflows/Node/badge.svg)](https://github.com/dev-protocol/protocol-v2/actions)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# Dev Protocol

This repository is the place to develop smart contracts for Dev Protocol.

- Whitepaper: https://github.com/dev-protocol/protocol/blob/main/docs/WHITEPAPER.md
- ホワイトペーパー(日本語): https://github.com/dev-protocol/protocol/blob/main/docs/WHITEPAPER.JA.md

## How to use

### install

First, install this repository as an npm package.

```bash
> npm i -D @devprotocol/protocol-v2
```

### import

You can use the Dev Protocol interface by importing it from a Solidity file.

```
import {IAddressRegistry} from "@devprotocol/protocol-v2/contracts/interface/IAddressRegistry.sol";
import {IPropertyFactory} from "@devprotocol/protocol-v2/contracts/interface/IPropertyFactory.sol";

contract TestContract {
    function validatePropertyAddress(address _property) external view {
        IAddressRegistry registry = IAddressRegistry(0x0a15Ccf5E6029AaAeBc5F01b09d3C240Dc56c5f9);
        IPropertyFactory propertyFactory = IPropertyFactory(registry.registries("PropertyFactory"));
        require(propertyFactory.isProperty(_property), "not property address");
    }
}
```

This is an example of logic that uses the PropertyFactory contract feature of the Dev Protocol to validate if it is a Property address.

The available interfaces can be found in "node_modules/@devprotocol/protocol-v2/contracts/interface/".

AddressRegistry holds the addresses of the contracts used in the Dev Protocol.

```
AddressRegistry address
arbitrum mainet：0x0a15Ccf5E6029AaAeBc5F01b09d3C240Dc56c5f9
arbitrum rinkeby：0xE75929F46355ad8C5C558755D836364f119BdB22
```

## How to contribute:

Read the [contributing guide](https://github.com/dev-protocol/protocol-v2/blob/main/.github/CONTRIBUTING.md), and create PR when you have time. 🧚✨

## How to setup

Executing the following command will compile each contract.

```
git clone https://github.com/dev-protocol/protocol-v2.git
cd protocol-v2
yarn
yarn generate
```

run the following command to test each contract.

```
yarn test
```

If you use Visual Studio Code, we recommend that you install the following plug-ins:

```
EditorConfig
vscode-eslint
solidity
```
