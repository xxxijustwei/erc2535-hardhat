import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { encodeFunctionData } from "viem/utils";
import { FacetCutAction, getSelectorsByName } from "@/scripts/utils.js";

export default buildModule("Diamond", (m) => {
	const dimaondCutFacet = m.contract("DiamondCutFacet");
	const diamond = m.contract("Diamond", [m.getAccount(0), dimaondCutFacet]);

	const diamondInit = m.contract("DiamondInit");
	const initFunc = encodeFunctionData({
		abi: [
			{
				inputs: [],
				name: "init",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
		],
		args: [],
	});

	const diamondLoupeFacet = m.contract("DiamondLoupeFacet");
	const diamondLoupeFacetSelectors = getSelectorsByName("DiamondLoupeFacet");
	const roleFacet = m.contract("RoleFacet");
	const roleFacetSelectors = getSelectorsByName("RoleFacet");

	const actions = [
		{
			facetAddress: diamondLoupeFacet,
			action: FacetCutAction.Add,
			functionSelectors: diamondLoupeFacetSelectors,
		},
		{
			facetAddress: roleFacet,
			action: FacetCutAction.Add,
			functionSelectors: roleFacetSelectors,
		},
	];

	const diamondCut = m.contractAt("IDiamondCut", diamond);
	m.call(diamondCut, "diamondCut", [actions, diamondInit, initFunc], {
		id: "diamondCut",
	});

	return {
		diamond,
		diamondInit,
		dimaondCutFacet,
		diamondLoupeFacet,
		roleFacet,
	};
});
