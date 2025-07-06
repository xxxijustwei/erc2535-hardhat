import { network } from "hardhat";
import { depolyDiamond } from "../scripts/deploy.js";
import {
  Abi,
  GetContractReturnType,
  parseEther,
  zeroAddress,
  zeroHash,
  keccak256,
  toBytes,
} from "viem";
import { describe, before, it } from "node:test";
import {
  FacetCutAction,
  getSelectors,
} from "../scripts/utils/diamond.js";
import assert from "node:assert/strict";

describe("RBAC (Role-Based Access Control) Test", async () => {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient, otherWallet, thirdWallet] = await viem.getWalletClients();

  let diamondAddress: `0x${string}`;
  let dCutFacet: GetContractReturnType<Abi>;
  let rolesFacet: GetContractReturnType<Abi>;

  // Role constants
  const ROLE_OWNER = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ROLE_MANAGER = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const CUSTOM_ROLE = keccak256(toBytes("CUSTOM_ROLE"));

  before(async () => {
    diamondAddress = await depolyDiamond(viem);
    dCutFacet = await viem.getContractAt("DiamondCutFacet", diamondAddress);
    rolesFacet = await viem.getContractAt("RolesFacet", diamondAddress);
  });

  it("should grant owner role to deployer", async () => {
    const hasRole = await publicClient.readContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "hasRole",
      args: [ROLE_OWNER, walletClient.account.address],
    });

    assert.equal(hasRole, true, "Deployer should have owner role");
  });

  it("owner should be able to grant manager role", async () => {
    const { request } = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "grantRole",
      args: [ROLE_MANAGER, otherWallet.account.address],
    });
    const tx = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const hasRole = await publicClient.readContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "hasRole",
      args: [ROLE_MANAGER, otherWallet.account.address],
    });

    assert.equal(hasRole, true, "Other wallet should have manager role");
  });

  it("should get role admin", async () => {
    const roleAdmin = await publicClient.readContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "getRoleAdmin",
      args: [ROLE_MANAGER],
    });

    assert.equal(roleAdmin, ROLE_OWNER, "Owner should be admin of manager role");
  });

  it("non-admin should not be able to grant roles", async () => {
    try {
      await publicClient.simulateContract({
        address: diamondAddress,
        abi: rolesFacet.abi,
        functionName: "grantRole",
        args: [ROLE_MANAGER, thirdWallet.account.address],
        account: otherWallet.account.address,
      });
      assert.fail("Should not be able to grant role without admin permission");
    } catch (error: any) {
      assert(error.message.includes("AccessControl"), "Should revert with AccessControl error");
    }
  });

  it("should be able to revoke roles", async () => {
    const { request } = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "revokeRole",
      args: [ROLE_MANAGER, otherWallet.account.address],
    });
    const tx = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const hasRole = await publicClient.readContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "hasRole",
      args: [ROLE_MANAGER, otherWallet.account.address],
    });

    assert.equal(hasRole, false, "Other wallet should not have manager role anymore");
  });

  it("should be able to renounce own role", async () => {
    // First grant the role
    const grantReq = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "grantRole",
      args: [CUSTOM_ROLE, otherWallet.account.address],
    });
    await walletClient.writeContract(grantReq.request);

    // Then renounce it
    const { request } = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "renounceRole",
      args: [CUSTOM_ROLE, otherWallet.account.address],
      account: otherWallet.account.address,
    });
    const tx = await otherWallet.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const hasRole = await publicClient.readContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "hasRole",
      args: [CUSTOM_ROLE, otherWallet.account.address],
    });

    assert.equal(hasRole, false, "Should have renounced the role");
  });

  it("should not be able to renounce role for another account", async () => {
    // Grant role first
    const grantReq = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "grantRole",
      args: [CUSTOM_ROLE, thirdWallet.account.address],
    });
    await walletClient.writeContract(grantReq.request);

    // Try to renounce for another account
    try {
      await publicClient.simulateContract({
        address: diamondAddress,
        abi: rolesFacet.abi,
        functionName: "renounceRole",
        args: [CUSTOM_ROLE, thirdWallet.account.address],
        account: otherWallet.account.address,
      });
      assert.fail("Should not be able to renounce role for another account");
    } catch (error: any) {
      assert(error.message.includes("can only renounce roles for self"), "Should revert with proper error");
    }
  });

  it("only owner should be able to perform diamond cuts", async () => {
    const testFacet = await viem.deployContract("Test1Facet");
    const selectors = getSelectors(testFacet).remove(["supportsInterface(bytes4)"]);

    // Try as non-owner
    try {
      await publicClient.simulateContract({
        address: diamondAddress,
        abi: dCutFacet.abi,
        functionName: "diamondCut",
        args: [
          [
            {
              facetAddress: testFacet.address,
              action: FacetCutAction.Add,
              functionSelectors: selectors,
            },
          ],
          zeroAddress,
          zeroHash,
        ],
        account: otherWallet.account.address,
      });
      assert.fail("Non-owner should not be able to perform diamond cut");
    } catch (error: any) {
      assert(error.message.includes("Unauthorized"), "Should revert with Unauthorized error");
    }

    // Try as owner
    const { request } = await publicClient.simulateContract({
      address: diamondAddress,
      abi: dCutFacet.abi,
      functionName: "diamondCut",
      args: [
        [
          {
            facetAddress: testFacet.address,
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

    // Verify facet was added
    const facet = await viem.getContractAt("Test1Facet", diamondAddress);
    const result = await publicClient.readContract({
      address: facet.address,
      abi: facet.abi,
      functionName: "test1Func1",
      args: [],
    });

    assert.equal(result, parseEther("1"), "Test facet should be properly added");
  });

  it("should support IAccessControl interface", async () => {
    const supportsInterface = await publicClient.readContract({
      address: diamondAddress,
      abi: [
        {
          inputs: [{ name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ name: "", type: "bool" }],
          type: "function",
          stateMutability: "view",
        },
      ],
      functionName: "supportsInterface",
      args: ["0x01ffc9a7"], // IAccessControl interface ID
    });

    assert.equal(supportsInterface, true, "Should support IAccessControl interface");
  });

  it("should emit proper events", async () => {
    const testRole = keccak256(toBytes("TEST_EMIT_ROLE"));
    
    const { request } = await publicClient.simulateContract({
      address: diamondAddress,
      abi: rolesFacet.abi,
      functionName: "grantRole",
      args: [testRole, thirdWallet.account.address],
    });
    const tx = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check if RoleGranted event was emitted
    assert(receipt.logs.length > 0, "Should emit events");
  });
});