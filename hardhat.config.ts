import hardhatIgnitionPlugin from "@nomicfoundation/hardhat-ignition";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
	plugins: [
		hardhatViem,
		hardhatToolboxViemPlugin,
		hardhatViemAssertions,
		hardhatNodeTestRunner,
		hardhatNetworkHelpers,
		hardhatIgnitionPlugin,
	],
	solidity: {
		profiles: {
			default: {
				version: "0.8.28",
			},
			production: {
				version: "0.8.28",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		},
	},
	networks: {
		local: {
			type: "http",
			chainType: "l1",
			url: "http://127.0.0.1:8545",
		},
		hardhatMainnet: {
			type: "edr-simulated",
			chainType: "l1",
		},
		hardhatOp: {
			type: "edr-simulated",
			chainType: "op",
		},
		ethereum: {
			type: "http",
			chainType: "l1",
			url: configVariable("ETHEREUM_RPC_URL"),
			accounts: [configVariable("ACCOUNT_MNEMONIC")],
		},
		sepolia: {
			type: "http",
			chainType: "l1",
			url: configVariable("SEPOLIA_RPC_URL"),
			accounts: [configVariable("ACCOUNT_MNEMONIC")],
		},
	},
	verify: {
		etherscan: {
			apiKey: configVariable("ETHERSCAN_API_KEY"),
		},
	},
};

export default config;
