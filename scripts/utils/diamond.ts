import { GetContractReturnType, getFunctionSignature } from "viem";
import { getFunctionSelector } from "viem/utils";

export const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
};

export const getSelectors = (contract: GetContractReturnType<any>) => {
    const selectors = contract.abi
        .filter((abi: any) => abi.type === "function")
        .filter((abi: any) => getFunctionSignature(abi) !== "init(bytes)")
        .reduce((acc: any, abi: any) => {
            acc.push(getFunctionSelector(abi));
            return acc;
        }, []);

    selectors.remove = remove;
    selectors.get = get;
    return selectors;
}

export const removeSelectors = (selectors: `0x${string}`[], signatures: string[]) => {
    const remove = signatures.map((signature) => getFunctionSelector(signature));
    return selectors.filter((selector) => !remove.includes(selector));
}

function remove(this: any, functionNames: string[]) {
    const selectors = this.filter((s: string) => {
        for (const func of functionNames) {
            if (s === getFunctionSelector(func)) return false;
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
            if (s === getFunctionSelector(func)) return true;
        }
        return false;
    });

    selectors.remove = remove;
    selectors.get = get;
    return selectors;
}