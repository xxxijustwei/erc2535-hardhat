import hre from "hardhat";
import { depolyDiamond } from "../scripts/deploy"
import { FacetCutAction } from "../scripts/utils/diamond";
import { Abi, GetContractReturnType, zeroAddress, zeroHash } from "viem";
import { assert } from "chai";

describe('Cache bug test', async () => {
    let dLoupeFacet: GetContractReturnType<Abi>;
    let test1Facet: GetContractReturnType<Abi>;
    const ownerSel = '0x8da5cb5b'

    const sel0 = '0x19e3b533' // fills up slot 1
    const sel1 = '0x0716c2ae' // fills up slot 1
    const sel2 = '0x11046047' // fills up slot 1
    const sel3 = '0xcf3bbe18' // fills up slot 1
    const sel4 = '0x24c1d5a7' // fills up slot 1
    const sel5 = '0xcbb835f6' // fills up slot 1
    const sel6 = '0xcbb835f7' // fills up slot 1
    const sel7 = '0xcbb835f8' // fills up slot 2
    const sel8 = '0xcbb835f9' // fills up slot 2
    const sel9 = '0xcbb835fa' // fills up slot 2
    const sel10 = '0xcbb835fb' // fills up slot 2

    before(async () => {
        let selectors: `0x${string}`[] = [
            sel0,
            sel1,
            sel2,
            sel3,
            sel4,
            sel5,
            sel6,
            sel7,
            sel8,
            sel9,
            sel10
        ];

        const publicClient = await hre.viem.getPublicClient();
        const [walletClient] = await hre.viem.getWalletClients();

        const diamond = await depolyDiamond();
        const dCutFacet = await hre.viem.getContractAt("DiamondCutFacet", diamond);
        dLoupeFacet = await hre.viem.getContractAt("DiamondLoupeFacet", diamond);
        
        test1Facet = await hre.viem.deployContract("Test1Facet");
        const add = await publicClient.simulateContract({
            address: diamond,
            abi: dCutFacet.abi,
            functionName: "diamondCut",
            args: [
                [{
                    facetAddress: test1Facet.address,
                    action: FacetCutAction.Add,
                    functionSelectors: selectors
                }],
                zeroAddress,
                zeroHash
            ]
        });
        const tx = await walletClient.writeContract(add.request);
        await publicClient.waitForTransactionReceipt({ hash: tx });

        selectors = [
            ownerSel,
            sel5,
            sel10
        ];

        const remove = await publicClient.simulateContract({
            address: diamond,
            abi: dCutFacet.abi,
            functionName: "diamondCut",
            args: [
                [{
                    facetAddress: zeroAddress,
                    action: FacetCutAction.Remove,
                    functionSelectors: selectors
                }],
                zeroAddress,
                zeroHash
            ]
        });
        const tx2 = await walletClient.writeContract(remove.request);
        await publicClient.waitForTransactionReceipt({ hash: tx2 });
    });

    it('should not exhibit the cache bug', async () => {
        const publicClient = await hre.viem.getPublicClient();
        let selectors = await publicClient.readContract({
            address: dLoupeFacet.address,
            abi: dLoupeFacet.abi,
            functionName: "facetFunctionSelectors",
            args: [
                test1Facet.address
            ]
        }) as `0x${string}`[];
    
        // Check individual correctness
        assert.isTrue(selectors.includes(sel0), 'Does not contain sel0')
        assert.isTrue(selectors.includes(sel1), 'Does not contain sel1')
        assert.isTrue(selectors.includes(sel2), 'Does not contain sel2')
        assert.isTrue(selectors.includes(sel3), 'Does not contain sel3')
        assert.isTrue(selectors.includes(sel4), 'Does not contain sel4')
        assert.isTrue(selectors.includes(sel6), 'Does not contain sel6')
        assert.isTrue(selectors.includes(sel7), 'Does not contain sel7')
        assert.isTrue(selectors.includes(sel8), 'Does not contain sel8')
        assert.isTrue(selectors.includes(sel9), 'Does not contain sel9')
    
        assert.isFalse(selectors.includes(ownerSel), 'Contains ownerSel')
        assert.isFalse(selectors.includes(sel10), 'Contains sel10')
        assert.isFalse(selectors.includes(sel5), 'Contains sel5')
      });
});