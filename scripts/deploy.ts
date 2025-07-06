import { FacetCutAction, getSelectors } from "./utils/diamond.js";
import { encodeFunctionData } from "viem";
import { NetworkConnection, NetworkManager } from "hardhat/types/network";

export const depolyDiamond = async (viem: NetworkConnection<"generic">["viem"]) => {
  const publicClient = await viem.getPublicClient();
  const [deployWallet] = await viem.getWalletClients();

  // deploy DiamondCutFacet
  const diamondCutFacet = await viem.deployContract("DiamondCutFacet");

  // deploy Diamond
  const diamond = await viem.deployContract("Diamond", [
    deployWallet.account.address,
    diamondCutFacet.address,
  ]);

  const diamondInit = await viem.deployContract("DiamondInit");

  const facetNames = ["DiamondLoupeFacet", "RolesFacet"];
  const cut = [];

  for (const facetName of facetNames) {
    const facet = await viem.deployContract(facetName);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  const diamondCut = await viem.getContractAt("IDiamondCut", diamond.address);
  const initFunc = encodeFunctionData({
    abi: diamondInit.abi,
    functionName: "init",
    args: [],
  });

  const { request } = await publicClient.simulateContract({
    address: diamond.address,
    abi: diamondCut.abi,
    functionName: "diamondCut",
    args: [cut, diamondInit.address, initFunc],
  });

  const tx = await deployWallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: tx });

  return diamond.address;
};
