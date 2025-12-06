import { network } from "hardhat";
import { depolyDiamond } from "./utils/deploy-diamond.js";

const main = async () => {
	const { viem, networkName } = await network.connect();

	console.log(`Deploying diamond to ${networkName}...`);
	const diamondAddress = await depolyDiamond(viem);
	console.log(`Diamond deployed: ${diamondAddress}`);
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
