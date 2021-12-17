import { Handler } from "@netlify/functions";
import ethers, { BigNumber } from "ethers";

enum Env {
  Local,
  Test,
  Production,
}

interface SendParams {
  addresses: string[];
  amounts: number[];
  env: string;
}

const handler: Handler = async (event, context) => {
  const params = JSON.parse(event.body) as SendParams;
  //console.log("got params", params);
  if (
    !params ||
    !params.addresses ||
    !params.amounts ||
    params.addresses.length === 0 ||
    params.amounts.length !== params.addresses.length ||
    !!Env[params.env]
  ) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Wrong data format",
      }),
    };
  }

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.TESTNET_PROVIDER_URL
  );

  const ABI = [
    {
      constant: false,
      inputs: [
        {
          name: "_spender",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  const contrAddress = "0x84b9b910527ad5c03a9ca831909e21e236ea7b06";
  const signer = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contrAddress, ABI, signer);

  /* const res = await contract.approve(
    "0x84b9b910527ad5c03a9ca831909e21e236ea7b07",
    ethers.utils.parseUnits("2.0", 3),
    {
      gasLimit: ethers.utils.parseUnits("1.0", 7),
    }
  );
  const rec = await res.wait();
  console.log("resulttt", res, rec); */

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  };
};

export { handler };
