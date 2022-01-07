import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { getChainByChainId } from "evm-chains";
import { useEffect, useState } from "react";
import { calcFullDistribution, splitDistribution } from "../../utils/calcs";
import { ContractAddress, SignedParams } from "../types";
import contractAddress from "../../contracts/contract-address.json";
import Token from "../../contracts/Token.json";
import Rewards from "../../contracts/Rewards.json";
import { SendParams } from "../types";

const isTest = true;
const batchSize = 3;

enum Env {
  Local,
  Test,
  Production,
}

type Dict<T> = Record<string, T>;

const rewardAddresses: Dict<string> = {
  Local: contractAddress.Rewards,
  Test: "0xcbd37FE9abB567f937EAF77d7C8471BB9EeBC413",
  Production: "0xabc",
};

const tokenAddresses: Dict<string> = {
  Local: "0xaba91fa7b4d090be80c4108e925628106e9be49e", //contractAddress.Token,
  Test: "0xA761036cA1f3e66b178aE20d1C2bdE05b7A9BB35",
  Production: "0xaba91fa7b4d090be80c4108e925628106e9be49e",
};

const blacklistedAddresses: Dict<ContractAddress[]> = {
  Local: [
    {
      address: "0x000000000000000000000000000000000000abcd",
      title: "Some address",
    },
    {
      address: "0x000000000000000000000000000000000000dEaD",
      title: "Burn address",
    },
  ],
  Test: [
    {
      address: "0x000000000000000000000000000000000000abcd",
      title: "Some address",
    },
    {
      address: "0x000000000000000000000000000000000000dEaD",
      title: "Burn address",
    },
  ],
  Production: [
    {
      address: "0x3DBc4D96869B855cCCe35576E0bd4b967F61C67c",
      title: "DEX address",
    },
    {
      address: "0x000000000000000000000000000000000000dEaD",
      title: "Burn address",
    },
  ],
};

const usedEnv =
  window.location.host.indexOf("localhost") > -1
    ? Env[Env.Local]
    : isTest
    ? Env[Env.Test]
    : Env[Env.Production];

const usedRewards = rewardAddresses[usedEnv];
const usedToken = tokenAddresses[usedEnv];
const usedBlacklist = blacklistedAddresses[usedEnv];

interface Props {
  walletAddress: string | undefined;
}
declare var window: any; // to fix 'window.ethereum' errors

export function UI(props: Props) {
  const [usedChainName, setUsedChainName] = useState<string>("");
  const [assetAmount, setAssetAmount] = useState<string>("0");
  //const [weiAmount, setWeiAmount] = useState<string>("0");
  const [simulateOnly, setSimulateOnly] = useState<boolean>(true);
  const [resultText, setResultText] = useState<string[]>([]);

  const amountDecimalRounder = 100000;
  function isMyNumeric(n: string) {
    if (!isNaN(parseFloat(n)) && isFinite(+n)) {
      let num = +n;
      num = num * amountDecimalRounder;
      if ((num * 10).toString() === num.toString() + "0") {
        return true;
      }
    }
    return false;
  }

  const updateHoldersReceived = (
    amount: number,
    holderBalanceAmount: number,
    total: number
  ) => {
    setResultText([
      "Received holders: " + amount + " / " + total,
      "Received holder balances: " + holderBalanceAmount + " / " + total,
    ]);
  };

  /* useEffect(() => {
    const setChainName = async () => {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const id = parseInt(ethers.BigNumber.from(chainId).toString());
      try {
        const chain = await getChainByChainId(id);
        console.log("got chain", chain);
        setUsedChainName(chain.name);
      } catch (ex) {
        // do nothing, the chain wasn't found. Probably some local chain
      }
    };
    if (window.ethereum) {
      setChainName();
    }
  }, []); */

  const confirmSend = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const getSplits = async (): Promise<SendParams[]> => {
      let num = +assetAmount;
      num = num * amountDecimalRounder;
      var big = BigNumber.from(num.toString())
        .mul(ethers.utils.parseUnits("1", 18))
        .div(amountDecimalRounder);

      const contract = new ethers.Contract(usedToken, Token.abi, provider);

      const fullData = await calcFullDistribution(
        contract,
        big,
        usedBlacklist,
        updateHoldersReceived
      );
      console.log("calculated full", fullData);

      const splitData = splitDistribution(fullData, batchSize);
      return splitData;
    };

    const getDisplayForSplits = (splits: SendParams[]): string[] => {
      let textLines: string[] = [];
      splits.forEach((split, i) => {
        const length = split.addresses.length;
        const totalAmount = split.amounts.reduce((main, curr) => {
          return main.add(curr);
        });
        const totalStr = ethers.utils.formatUnits(totalAmount, 18);
        textLines.push(
          `Batch number ${
            i + 1
          } has ${length} users with total reward ${totalStr} BNB`
        );
      });
      return textLines;
    };
    if (isMyNumeric(assetAmount)) {
      if (simulateOnly) {
        const splitData = await getSplits();
        console.log("got splits", splitData);
        const res = getDisplayForSplits(splitData);
        setResultText(res);
      } else if (
        window.confirm(
          "Are you sure you want to distribute " + assetAmount + " BNB?"
        )
      ) {
        console.log("yes");
        const splitData = await getSplits();
        splitData.forEach(async (sendItem) => {
          const contract = new ethers.Contract(
            usedRewards,
            Rewards.abi,
            provider.getSigner()
          );
          const res = await contract.distribute(
            sendItem.addresses,
            sendItem.amounts,
            { value: sendItem.totalAmount }
          );
          await res.wait();
          /*         const signed = await provider
            .getSigner()
            .signMessage(JSON.stringify(sendItem));
          const sendData: SignedParams = {
            originalMsg: sendItem,
            signedMsg: signed,
          };
          const toSend = JSON.stringify(sendData); */
          /*         axios({
            method: "post",
            url: "/.netlify/functions/runTx",
            data: toSend,
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          const res = await axios.post("/.netlify/functions/runTx", toSend);
          console.log("send result", res, toSend); */
        });
      }
    } else {
      alert("Fix your amount");
    }
  };

  return (
    <div className="create-container pt-5 pb-0 px-5" id="what">
      <div>Used environment: {usedEnv}</div>
      <div>Your wallet: {props.walletAddress}</div>{" "}
      <div>Used token: {usedToken}</div>
      <div>
        Blacklisted addresses:{" "}
        {usedBlacklist.map((b, i) => (
          <span key={i} style={{ margin: "15px" }}>
            {b.address + " (" + b.title + ")"}
          </span>
        ))}
      </div>
      <div>
        BNB amount:{" "}
        <input
          type="text"
          value={assetAmount.toString()}
          onChange={(e) => setAssetAmount(e.target.value)}
        ></input>
      </div>
      <div>
        Simulate only:{" "}
        <input
          type="checkbox"
          checked={simulateOnly}
          onChange={() => setSimulateOnly(!simulateOnly)}
        ></input>
      </div>
      <div>
        <input type="button" onClick={confirmSend} value="Send"></input>
      </div>
      <div>Results</div>
      <div>
        {resultText.map((text, i) => {
          return (
            <div key={i}>
              <input type="text" disabled={true} value={text}></input>
            </div>
          );
        })}
      </div>
    </div>
  );
}
