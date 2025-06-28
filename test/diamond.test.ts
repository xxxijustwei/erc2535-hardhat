import { network } from "hardhat";
import { depolyDiamond } from "../scripts/deploy.js";
import { Abi, GetContractReturnType, parseEther, zeroAddress, zeroHash } from "viem";
import { describe, before, it } from "node:test";
import { FacetCutAction, getSelectors, removeSelectors } from "../scripts/utils/diamond.js";
import assert from "node:assert/strict";

describe('Diamond Test', async () => {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const [walletClient] = await viem.getWalletClients();

    let diamondAddress: `0x${string}`;
    let dCutFacet: GetContractReturnType<Abi>;
    let dLoupeFacet: GetContractReturnType<Abi>
    let ownershipFacet: GetContractReturnType<Abi>;

    const addresses: `0x${string}`[] = [];

    const getFacetFunctionSelectors = async (addr: `0x${string}`) => {
        return await publicClient.readContract({
            address: diamondAddress,
            abi: dLoupeFacet.abi,
            functionName: "facetFunctionSelectors",
            args: [
                addr
            ]
        });
    }

    const getSelectorFacetAddress = async (selector: `0x${string}`) => {
        return await publicClient.readContract({
            address: diamondAddress,
            abi: dLoupeFacet.abi,
            functionName: "facetAddress",
            args: [
                selector
            ]
        });
    }

    before(async () => {
        diamondAddress = await depolyDiamond();
        dCutFacet = await viem.getContractAt("DiamondCutFacet", diamondAddress);
        dLoupeFacet = await viem.getContractAt("DiamondLoupeFacet", diamondAddress);
        ownershipFacet = await viem.getContractAt("OwnershipFacet", diamondAddress);
    });

    describe('Common Test', async () => {
        it('should have three facets -- call to facetAddresses function', async () => {
            const result = await publicClient.readContract({
                address: diamondAddress,
                abi: dLoupeFacet.abi,
                functionName: 'facetAddresses',
            }) as `0x${string}`[];
            result.map(addr => addresses.push(addr));
    
            assert.equal(addresses.length, 3);
        });
    
        it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
            const cutSelectors = getSelectors(dCutFacet);
            const loupeSelectors = getSelectors(dLoupeFacet);
            const ownershipSelectors = getSelectors(ownershipFacet);
    
            assert.deepEqual(cutSelectors, await getFacetFunctionSelectors(addresses[0]));
            assert.deepEqual(loupeSelectors, await getFacetFunctionSelectors(addresses[1]));
            assert.deepEqual(ownershipSelectors, await getFacetFunctionSelectors(addresses[2]));
        });
    
        it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
            assert.equal(addresses[0], await getSelectorFacetAddress('0x1f931c1c'));
            assert.equal(addresses[1], await getSelectorFacetAddress('0xcdffacc6'));
            assert.equal(addresses[1], await getSelectorFacetAddress('0x01ffc9a7'));
            assert.equal(addresses[2], await getSelectorFacetAddress('0xf2fde38b'));
        });
    });

    describe('Facet Test', () => {
        it('should add test1 functions', async () => {
            const facet = await viem.deployContract("Test1Facet");
            addresses.push(facet.address);

            const selectors = getSelectors(facet).remove(['supportsInterface(bytes4)']);
            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
                abi: dCutFacet.abi,
                functionName: "diamondCut",
                args: [
                    [{
                        facetAddress: facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    zeroAddress,
                    zeroHash
                ]
            });
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.deepEqual(selectors, await getFacetFunctionSelectors(facet.address));
        });

        it('should test function call', async () => {
            const facet = await viem.getContractAt("Test1Facet", diamondAddress);
            const result = await publicClient.readContract({
                address: facet.address,
                abi: facet.abi,
                functionName: "test1Func1",
                args: []
            });

            assert.equal(result, parseEther('1'));
        });

        it('should replace supportsInterface function', async () => {
            const facet = await viem.getContractAt("Test1Facet", diamondAddress);
            const selectors = getSelectors(facet).get(['supportsInterface(bytes4)']);
            const addr = addresses[3];
            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
                abi: dCutFacet.abi,
                functionName: "diamondCut",
                args: [
                    [{
                        facetAddress: addr,
                        action: FacetCutAction.Replace,
                        functionSelectors: selectors
                    }],
                    zeroAddress,
                    zeroHash
                ]
            });
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.deepEqual(getSelectors(facet), await getFacetFunctionSelectors(addr));
        });

        it('should add test2 functions', async () => {
            const facet = await viem.deployContract("Test2Facet");
            addresses.push(facet.address);

            const selectors = getSelectors(facet);
            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
                abi: dCutFacet.abi,
                functionName: "diamondCut",
                args: [
                    [{
                        facetAddress: facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    zeroAddress,
                    zeroHash
                ]
            });
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.deepEqual(selectors, await getFacetFunctionSelectors(facet.address));
        });

        it('should remove some test2 functions', async () => {
            const facet = await viem.getContractAt("Test2Facet", diamondAddress);
            const keepFuncs = ['test2Func1()', 'test2Func5()', 'test2Func6()', 'test2Func19()', 'test2Func20()'];
            const selectors = getSelectors(facet).remove(keepFuncs);
            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
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
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.deepEqual(getSelectors(facet).get(keepFuncs), await getFacetFunctionSelectors(addresses[4]));
        });

        it('should remove some test1 functions', async () => {
            const facet = await viem.getContractAt("Test1Facet", diamondAddress);
            const keepFuncs = ['test1Func2()', 'test1Func11()', 'test1Func12()'];
            const selectors = getSelectors(facet).remove(keepFuncs);
            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
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
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.deepEqual(getSelectors(facet).get(keepFuncs), await getFacetFunctionSelectors(addresses[3]));
        });

        it('remove all functions and facets except \'diamondCut\' and \'facets\'', async () => {
            let selectors = [];
            let facets = await publicClient.readContract({
                address: diamondAddress,
                abi: dLoupeFacet.abi,
                functionName: "facets"
            }) as any;
            for (let i = 0; i < facets.length; i++) {
                selectors.push(...facets[i].functionSelectors)
            }
            selectors = removeSelectors(selectors, ['facets()', 'diamondCut((address,uint8,bytes4[])[],address,bytes)']);

            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
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
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            facets = await publicClient.readContract({
                address: diamondAddress,
                abi: dLoupeFacet.abi,
                functionName: "facets"
            });

            assert.equal(facets.length, 2)
            assert.equal(facets[0].facetAddress, addresses[0])
            assert.deepEqual(facets[0].functionSelectors, ['0x1f931c1c'])
            assert.equal(facets[1].facetAddress, addresses[1])
            assert.deepEqual(facets[1].functionSelectors, ['0x7a0ed627'])
        });

        it('add most functions and facets', async () => {
            const diamondLoupeFacetSelectors = getSelectors(dLoupeFacet).remove(['supportsInterface(bytes4)']);
            const test1Facet = await viem.getContractAt("Test1Facet", diamondAddress);
            const test2Facet = await viem.getContractAt("Test2Facet", diamondAddress);

            const cut = [
                {
                    facetAddress: addresses[1],
                    action: FacetCutAction.Add,
                    functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
                },
                {
                    facetAddress: addresses[2],
                    action: FacetCutAction.Add,
                    functionSelectors: getSelectors(ownershipFacet)
                },
                {
                    facetAddress: addresses[3],
                    action: FacetCutAction.Add,
                    functionSelectors: getSelectors(test1Facet)
                },
                {
                    facetAddress: addresses[4],
                    action: FacetCutAction.Add,
                    functionSelectors: getSelectors(test2Facet)
                }
            ];

            const { request } = await publicClient.simulateContract({
                address: diamondAddress,
                abi: dCutFacet.abi,
                functionName: "diamondCut",
                args: [
                    cut,
                    zeroAddress,
                    zeroHash
                ]
            });
            const tx = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: tx });

            const facets = await publicClient.readContract({
                address: diamondAddress,
                abi: dLoupeFacet.abi,
                functionName: "facets"
            }) as any;
            const facetAddresses = await publicClient.readContract({
                address: diamondAddress,
                abi: dLoupeFacet.abi,
                functionName: "facetAddresses"
            }) as any;

            assert.equal(facetAddresses.length, 5)
            assert.equal(facets.length, 5)
            assert.deepEqual(facetAddresses.map((s: any) => s.toLowerCase()), addresses.map(s => s.toLowerCase()))
            assert.equal(facets[0].facetAddress, facetAddresses[0], 'first facet')
            assert.equal(facets[1].facetAddress, facetAddresses[1], 'second facet')
            assert.equal(facets[2].facetAddress, facetAddresses[2], 'third facet')
            assert.equal(facets[3].facetAddress, facetAddresses[3], 'fourth facet')
            assert.equal(facets[4].facetAddress, facetAddresses[4], 'fifth facet')
            assert.deepEqual(facets[0].functionSelectors, getSelectors(dCutFacet))
            assert.deepEqual(facets[1].functionSelectors, diamondLoupeFacetSelectors)
            assert.deepEqual(facets[2].functionSelectors, getSelectors(ownershipFacet))
            assert.deepEqual(facets[3].functionSelectors, getSelectors(test1Facet))
            assert.deepEqual(facets[4].functionSelectors, getSelectors(test2Facet))
        });
    })
});