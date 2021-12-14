import { Handler } from "@netlify/functions";
import Moralis from "moralis/node";

const handler: Handler = async (event, context) => {
  const serverUrl = process.env.TESTNET_SERVER;
  const appId = process.env.TESTNET_APP_ID;
  Moralis.start({ serverUrl, appId });

  const options = {
    chain: "bsc testnet",
    address: "0xF58014d71Dbc231495a6e3BfC2A9289c55b4eE4a",
  };

  //const query = new Moralis.Query("EthTransactions");
  const balance = await Moralis.Web3API.account.getNativeBalance(options);
  console.log("bal", balance);
  /* 

  const results = await query.find(); */

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World" + balance + " a " + balance.balance,
    }),
  };
};

export { handler };
