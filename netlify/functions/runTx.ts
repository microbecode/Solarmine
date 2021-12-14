import { Handler } from "@netlify/functions";
import ethers, { BigNumber } from "ethers";
//import Moralis from "moralis/node";

const handler: Handler = async (event, context) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.TESTNET_PROVIDER_URL
  );

  const ABI = [
    {
      constant: false,
      inputs: [],
      name: "deposit",
      outputs: [],
      payable: true,
      stateMutability: "payable",
      type: "function",
    },
  ];
  const signer = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    ABI,
    signer
  );

  const res = await contract.deposit({
    value: BigNumber.from(50),
    gasLimit: ethers.utils.parseUnits("1.0", 6),
  });
  const rec = await res.wait();
  console.log("resulttt", res, rec);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  };
};

export { handler };
