<div align="center">
  
# 💎 Diamond Hardhat v3 Implementation

### A modern implementation of the [EIP-2535 Diamond Standard](https://github.com/ethereum/EIPs/issues/2535) using Hardhat v3 and Viem

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue.svg)](https://docs.soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v3.0.0--next-yellow.svg)](https://hardhat.org/)
[![Viem](https://img.shields.io/badge/Viem-2.31.4-green.svg)](https://viem.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Diamond Upgrading](#-diamond-upgrading)
- [Contributing](#-contributing)
- [Resources](#-resources)

---

## 🌟 Overview

This repository provides a production-ready implementation of the EIP-2535 Diamond Standard, also known as the "Multi-Facet Proxy" pattern. Diamonds enable smart contracts to exceed the 24KB bytecode limit while providing fine-grained upgradeability control.

### Key Benefits

- **🚀 Gas Optimized**: Loupe functions optimized for on-chain transactions
- **🔧 Modern Stack**: Built with Hardhat v3, Viem, and TypeScript
- **📦 Modular Design**: Easy to add, replace, or remove functionality
- **🛡️ Battle Tested**: Comprehensive test coverage for all diamond operations
- **⚡ Fast Development**: Uses Bun package manager for blazing fast builds

## ✨ Features

- **EIP-2535 Compliant**: Full implementation of the Diamond Standard
- **Loupe Functions**: All four standard loupe functions included
- **Ownership Management**: Built-in ownership facet following ERC-173
- **TypeScript Support**: Full type safety for scripts and tests
- **Gas Efficient**: Optimized storage patterns and function selectors
- **Flexible Upgrades**: Add, replace, or remove functions in a single transaction

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User/DApp                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Diamond Proxy                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Fallback Function                  │    │
│  │            (Delegates to Facet Functions)           │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ DiamondCut   │  │ DiamondLoupe │  │  Ownership   │
│    Facet     │  │    Facet     │  │    Facet     │
└──────────────┘  └──────────────┘  └──────────────┘
                           │
                  ┌────────┴────────┐
                  ▼                ▼
          ┌──────────────┐ ┌──────────────┐
          │ Custom Facet │ │ Custom Facet │
          │      #1      │ │      #2      │
          └──────────────┘ └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [Bun](https://bun.sh/) (recommended) or npm/yarn
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:xxxijustwei/erc2535-hardhat.git
cd erc2535-hardhat

# Install dependencies with Bun (recommended)
bun install

# Or with npm
npm install
```

### Deploy Your First Diamond

```bash
# Deploy to local network
bunx hardhat run scripts/deploy.ts

# Deploy to specific network
bunx hardhat run scripts/deploy.ts --network sepolia
``` 

---

## 📁 Project Structure

```
erc2535-hardhat/
│
├── 📁 contracts/                   # Smart contracts
│   ├── 💎 Diamond.sol              # Main diamond proxy contract
│   ├── 📁 facets/                  # Facet implementations
│   │   ├── DiamondCutFacet.sol     # Diamond upgrade functions facet
│   │   ├── DiamondLoupeFacet.sol   # Introspection functions facet
│   │   ├── OwnershipFacet.sol      # Ownership management facet
│   │   ├── Test1Facet.sol          # Test1 facet
│   │   └── Test2Facet.sol          # Test2 facet
│   ├── 📁 interfaces/              # Contract interfaces
│   ├── 📁 libraries/               # Shared libraries
│   │   └── LibDiamond.sol          # Diamond storage and helpers
│   └── 📁 upgradeInitializers/     # Initialization contracts
│
├── 📁 scripts/                     # Deployment and utilities
│   ├── deploy.ts                   # Main deployment script
│   └── 📁 utils/                   # Helper functions
│
├── 📁 test/                        # Test suite
│   ├── cacheBug.test.ts            # Cache bug tests
│   └── diamond.test.ts             # Comprehensive tests
│
├── ⚙️ hardhat.config.ts            # Hardhat configuration
├── 📦 package.json                 # Dependencies
└── 📝 README.md                    # This file
```

---

## 📖 Usage Guide

### Deployment Process

The deployment script (`scripts/deploy.ts`) follows these steps:

1. **Deploy DiamondCutFacet** - Provides the `diamondCut` function for upgrades
2. **Deploy Diamond** - Creates the main proxy with owner and DiamondCutFacet
3. **Deploy DiamondInit** - Initialization contract for setting initial state
4. **Deploy Facets** - Deploy all additional facets (Loupe, Ownership, etc.)
5. **Cut Diamond** - Add all facet functions to the diamond in one transaction

### Working with Facets

#### Creating a New Facet

```solidity
// contracts/facets/MyFacet.sol
contract MyFacet {
    // Using diamond storage pattern
    bytes32 constant STORAGE_POSITION = keccak256("my.facet.storage");
    
    struct MyStorage {
        uint256 value;
        mapping(address => bool) users;
    }
    
    function getStorage() internal pure returns (MyStorage storage ms) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ms.slot := position
        }
    }
    
    function setValue(uint256 _value) external {
        MyStorage storage ms = getStorage();
        ms.value = _value;
    }
}
```

#### Calling Diamond Functions with Viem

```typescript
import { getContractAt } from "@nomicfoundation/hardhat-viem";

// Get diamond instance with specific facet ABI
const diamondAddress = "0x...";
const myFacet = await getContractAt("MyFacet", diamondAddress);

// Call function through diamond proxy
const tx = await myFacet.setValue(42);
await tx.wait();
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun test

# Run with coverage
bunx hardhat coverage

# Run specific test file
bunx hardhat test test/diamond.test.ts
```

### Test Coverage

- ✅ Diamond deployment
- ✅ Facet addition/replacement/removal
- ✅ Function selector management
- ✅ Loupe function queries
- ✅ Ownership transfers
- ✅ Initialization patterns
- ✅ Edge cases and error handling

---

## 💎 Diamond Upgrading

### Adding Functions

```typescript
const { request } = await publicClient.simulateContract({
  address: diamondAddress,
  abi: dCutFacet.abi,
  functionName: "diamondCut",
  args: [
    [
      {
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors,
      },
    ],
    zeroAddress,
    zeroHash,
  ],
});
const tx = await walletClient.writeContract(request);
await publicClient.waitForTransactionReceipt({ hash: tx });
```

### Replacing Functions

```typescript
const { request } = await publicClient.simulateContract({
  address: diamondAddress,
  abi: dCutFacet.abi,
  functionName: "diamondCut",
  args: [
    [
      {
        facetAddress: addr,
        action: FacetCutAction.Replace,
        functionSelectors: selectors,
      },
    ],
    zeroAddress,
    zeroHash,
  ],
});
const tx = await walletClient.writeContract(request);
await publicClient.waitForTransactionReceipt({ hash: tx });
```

### Removing Functions

```typescript
const { request } = await publicClient.simulateContract({
  address: diamondAddress,
  abi: dCutFacet.abi,
  functionName: "diamondCut",
  args: [
    [
      {
        facetAddress: zeroAddress,
        action: FacetCutAction.Remove,
        functionSelectors: selectors,
      },
    ],
    zeroAddress,
    zeroHash,
  ],
});
const tx = await walletClient.writeContract(request);
await publicClient.waitForTransactionReceipt({ hash: tx });
```

### Important Notes

- ⚡ All changes happen in a single transaction
- 🔒 Optional upgrade functionality (can create immutable diamonds)
- 🎯 Initialization function can be called during upgrades
- ✨ Maintains consistent state throughout the upgrade process

---

## 🛠️ Advanced Topics

### Diamond Storage Pattern

The Diamond Storage pattern allows facets to share storage without conflicts:

```solidity
library LibAppStorage {
    bytes32 constant STORAGE_POSITION = keccak256("app.storage");
    
    struct AppStorage {
        uint256 totalSupply;
        mapping(address => uint256) balances;
        address admin;
    }
    
    function appStorage() internal pure returns (AppStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
```

### Security Considerations

- 🔐 **Access Control**: Implement proper access control for `diamondCut`
- 🛡️ **Facet Validation**: Verify facet addresses before adding
- ⚠️ **Selector Clashes**: Ensure no function selector conflicts
- 🔍 **Audit Trail**: Log all diamond upgrades for transparency

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write comprehensive tests for new features
- Follow existing code style and conventions
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📚 Resources

### Official Documentation
- 📖 [EIP-2535: Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535)
- 🌐 [Diamond Standard Reference](https://github.com/mudgen/diamond)

### Tutorials & Articles
- 📝 [Introduction to the Diamond Standard](https://eip2535diamonds.substack.com/p/introduction-to-the-diamond-standard)
- 🎓 [Understanding Diamonds on Ethereum](https://dev.to/mudgen/understanding-diamonds-on-ethereum-1fb)
- 🔧 [Solidity Storage Layout For Proxy Contracts](https://medium.com/1milliondevs/solidity-storage-layout-for-proxy-contracts-and-diamonds-c4f009b6903)
- 💡 [Upgradeable Smart Contracts Guide](https://hiddentao.com/archives/2020/05/28/upgradeable-smart-contracts-using-diamond-standard)

### Community & Support
- 💬 [EIP-2535 Diamonds Discord](https://discord.gg/kQewPw2)
- 🐦 [Follow Nick Mudge on Twitter](https://twitter.com/mudgen)
- 📧 [Email Support](mailto:nick@perfectabstractions.com)

---

## 👥 Authors

- **Nick Mudge** - *Original Implementation* - [@mudgen](https://github.com/mudgen)
- **xxxijustwei** - *Hardhat v3 Migration* - [@xxxijustwei](https://github.com/xxxijustwei)

---

<div align="center">

### 🌟 Star this repo if you find it helpful!

Made with ❤️ by the Diamond Standard Community

</div>
