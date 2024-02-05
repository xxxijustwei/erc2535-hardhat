import hre from "hardhat";
import { FacetCutAction, getSelectors } from "./utils/diamond";
import { encodeFunctionData } from "viem";

export const depolyDiamond = async () => {
    const publicClient = await hre.viem.getPublicClient();
    const [deployWallet] = await hre.viem.getWalletClients();

    // deploy DiamondCutFacet
    const diamondCutFacet = await hre.viem.deployContract("DiamondCutFacet");

    // deploy Diamond
    const diamond = await hre.viem.deployContract("Diamond", [
        deployWallet.account.address,
        diamondCutFacet.address
    ]);

    const diamondInit = await hre.viem.deployContract("DiamondInit");

    const facetNames = [
        'DiamondLoupeFacet',
        'OwnershipFacet',
    ];
    const cut = [];

    for (const facetName of facetNames) {
        const facet = await hre.viem.deployContract(facetName);
        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet)
        });
    }

    const diamondCut = await hre.viem.getContractAt("IDiamondCut", diamond.address);
    const initFunc = encodeFunctionData({
        abi: diamondInit.abi,
        functionName: "init"
    });

    const { request } = await publicClient.simulateContract({
        address: diamond.address,
        abi: diamondCut.abi,
        functionName: "diamondCut",
        args: [
            cut,
            diamondInit.address,
            initFunc
        ]
    });

    const tx = await deployWallet.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    return diamond.address;
}