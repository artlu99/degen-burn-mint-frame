import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import contractAbi from "./contract.json";
const contractAddress = process.env.CONTRACT_ADDRESS as `0x`;

const tokenUri = process.env.TOKEN_URI as string;

const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x`) || "");

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_URL),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.ALCHEMY_URL),
});

export async function mintNft(toAddress: string) {
  try {
    const { request }: any = await publicClient.simulateContract({
      account,
      address: contractAddress,
      abi: contractAbi.output.abi,
      functionName: "safeMint",
      args: [toAddress, tokenUri],
    });
    const transaction = await walletClient.writeContract(request);
    return transaction;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function balanceOf(address: string) {
  try {
    const balanceData = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi.output.abi,
      functionName: "balanceOf",
      args: [address as `0x`]
    });
    const balance: number = Number(balanceData)
    return balance
  } catch (error) {
    console.log(error);
    return error;
  }
}
