/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type GetContractReturnType, toFunctionSignature } from "viem";
import { toFunctionSelector } from "viem/utils";

export const FacetCutAction = {
	Add: 0,
	Replace: 1,
	Remove: 2,
};

export const getSelectors = (contract: GetContractReturnType<any>) => {
	const selectors = contract.abi
		.filter((abi: any) => abi.type === "function")
		.filter((abi: any) => toFunctionSignature(abi) !== "init(bytes)")
		.reduce((acc: any, abi: any) => {
			acc.push(toFunctionSelector(abi));
			return acc;
		}, []);

	selectors.remove = remove;
	selectors.get = get;
	return selectors;
};

export const getSelectorsByName = (facetName: string) => {
	const artifactPath = join(
		process.cwd(),
		"artifacts",
		"contracts",
		"facets",
		`${facetName}.sol`,
		`${facetName}.json`,
	);
	const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
	const { abi } = artifact;
	const selectors = abi
		.filter((abi: any) => abi.type === "function")
		.filter((abi: any) => toFunctionSignature(abi) !== "init(bytes)")
		.reduce((acc: any, abi: any) => {
			acc.push(toFunctionSelector(abi));
			return acc;
		}, []);
	return selectors;
};

export const removeSelectors = (
	selectors: `0x${string}`[],
	signatures: string[],
) => {
	const remove = signatures.map((signature) => toFunctionSelector(signature));
	return selectors.filter((selector) => !remove.includes(selector));
};

function remove(this: any, functionNames: string[]) {
	const selectors = this.filter((s: string) => {
		for (const func of functionNames) {
			if (s === toFunctionSelector(func)) return false;
		}
		return true;
	});

	selectors.remove = remove;
	selectors.get = get;
	return selectors;
}

function get(this: any, functionNames: string[]) {
	const selectors = this.filter((s: string) => {
		for (const func of functionNames) {
			if (s === toFunctionSelector(func)) return true;
		}
		return false;
	});

	selectors.remove = remove;
	selectors.get = get;
	return selectors;
}
