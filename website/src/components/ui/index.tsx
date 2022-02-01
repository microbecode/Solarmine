import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { getChainByChainId } from "evm-chains";
import { useEffect, useState } from "react";
import { calcFullDistribution, splitDistribution } from "../../utils/calcs";
import {
  ContractAddress,
  SendBatch,
  HumanizedSendBatch,
  ExportFile,
  HumanizedSendItem, 
} from "../types";
import contractAddress from "../../contracts/contract-address.json";
import Token from "../../contracts/Token.json";
import Rewards from "../../contracts/Rewards.json";

const isTest = true;
const batchSize = 50; // 500 results in gas cost of about 18m

enum Env {
  Local,
  Test,
  Production,
}

type Dict<T> = Record<string, T>;

const rewardAddresses: Dict<string> = {
  Local: contractAddress.Rewards,
  Test: "0x8d5Aa34A03920cA11e153aD493148693bcD2E90D",
  Production: "0xabc",
};

const tokenAddresses: Dict<string> = {
  Local: contractAddress.Token,
  Test: "0x94cEB1634Be7AE39c9DDBC424f707c112fA4f9B6",
  Production: "0xaba91fa7b4d090be80c4108e925628106e9be49e",
};

const blacklistedAddresses: Dict<ContractAddress[]> = {
  Local: [
    {
      address: "0x6100000000000000000000000000000000000008",
      title: "Some address",
    },
    {
      address: "0x000000000000000000000000000000000000dEaD",
      title: "Burn address",
    },
  ],
  Test: [
    {
      address: "0x6100000000000000000000000000000000000000",
      title: "Wannabe-LP",
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
  const [resultText, setResultText] = useState<string[]>([]);
  const [sendBatches, setSendBatches] = useState<SendBatch[]>([]);
  const [nextBatchSendIndex, setNextBatchSendIndex] = useState<number>(0);
  const [waitingForTx, setWaitingForTx] = useState<boolean>(false);
  const [previousTxHash, setPreviousTxHash] = useState<string>("");

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
    total: number,
    totalHoldersToCheck: number
  ) => {
    setResultText([
      "Received all holders: " + amount + " / " + total,
      "Received non-blacklisted holder balances: " +
        holderBalanceAmount +
        " / " +
        totalHoldersToCheck,
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

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  const calculateBatches = async () => {
    const getSplits = async (): Promise<SendBatch[]> => {
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

    if (isMyNumeric(assetAmount)) {
      const batchData = await getSplits();
      setSendBatches(batchData);
      console.log("got batches", batchData);
      //const res = getDisplayForSplits(splitData);
      //setResultText(res);
    } else {
      alert("Fix your amount");
    }
  };

  const getDisplayForBatch = (batch: SendBatch, index: number): string => {
    const length = batch.addresses.length;
    const totalAmount = batch.amounts.reduce((main, curr) => {
      return main.add(curr);
    });
    const totalStr = ethers.utils.formatUnits(totalAmount, 18);
    return `Batch number ${
      index + 1
    } has ${length} users with total reward ${totalStr} BNB`;
  };

  const sendBatch = async (index: number) => {
    const contract = new ethers.Contract(
      usedRewards,
      Rewards.abi,
      provider.getSigner()
    );
    const batch = sendBatches[index];
    try {
      const res: ethers.providers.TransactionResponse =
        await contract.distribute(batch.addresses, batch.amounts, {
          value: batch.totalAmount,
        });

      setWaitingForTx(true);
      setPreviousTxHash(res.hash);
      console.log("got res", res);

      const final = await res.wait();

      const copyBatch = { ...batch };
      copyBatch.transactionHash = final.transactionHash;
      const copyList = [...sendBatches];
      copyList[index] = copyBatch;
      setSendBatches(copyList);

      setWaitingForTx(false);
      console.log("got final", final);

      // For debugging
      const checkBalances = async () => {
        for (let i = 0; i < 1000000000; i++) {} // sleep a bit first
        console.log("ready");

        for (let i = 0; i < batch.addresses.length; i++) {
          const balance = await provider.getBalance(batch.addresses[i]);
          console.log(
            "address balance",
            batch.addresses[i],
            balance.toString()
          );
        }
      };
      //await checkBalances();

      /**/

      setNextBatchSendIndex(nextBatchSendIndex + 1);
    } catch (ex: any) {
      console.error("exxx", ex);
      alert("Batch failed: " + ex?.data?.message);
      return;
    }
  };

  const exportData = () => {
    const humanizeData = (batches: SendBatch[]): ExportFile => {
      const humanized: HumanizedSendBatch[] = [];
      for (let i = 0; i < batches.length; i++) {
        const amounts = batches[i].amounts.map((a) => a.toString());
        const totalAmount = batches[i].totalAmount.toString();

        var holders: HumanizedSendItem[] = [];
        for (let a = 0; a < amounts.length; a++) {
          var item: HumanizedSendItem = {
            address: batches[i].addresses[a],
            sentAmount: amounts[a],
          };
          holders.push(item);
        }

        const hum: HumanizedSendBatch = {
          totalAmount: totalAmount,
          transactionHash: batches[i].transactionHash,
          holders: holders,
        };
        humanized.push(hum);
      }
      var exp: ExportFile = {
        batches: humanized,
      };
      return exp;
    };

    const getNowStr = (): string => {
      const now = new Date();
      const humanizedDate =
        "" +
        now.getUTCFullYear() +
        now.getUTCMonth() +
        now.getUTCDate() +
        now.getUTCHours() +
        now.getUTCMinutes();

      return humanizedDate;
    };

    const json = JSON.stringify(humanizeData(sendBatches));
    const blob = new Blob([json]);
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);

    const filename = "solarmine-reward-" + getNowStr() + ".json";
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  // Used only for local testing
  const checkSomeBalances = async () => {
    const bals: BigNumber[] = [];
    const addrs: string[] = [];

    addrs.push("0x6100000000000000000000000000000000000034");
    addrs.push("0x6100000000000000000000000000000000000002");
    addrs.push("0x6100000000000000000000000000000000000008");

    for (let i = 0; i < addrs.length; i++) {
      const balance = await provider.getBalance(addrs[i]);
      console.log("address balance", addrs[i], balance.toString());
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
        <input
          type="button"
          onClick={calculateBatches}
          value="Calculate batches"
        ></input>
      </div>
      <div>
        Progress:{" "}
        <input
          type="text"
          disabled={true}
          value={resultText.join(", ")}
          style={{ width: "800px" }}
        ></input>
      </div>
      {sendBatches && sendBatches.length > 0 && (
        <div>
          <input
            type="button"
            value="Download data file"
            onClick={exportData}
          ></input>
          <input
            type="button"
            value="Test"
            onClick={checkSomeBalances}
            hidden={usedEnv !== Env[Env.Local].toString()}
          ></input>
        </div>
      )}
      <div>Previous tx hash: {previousTxHash}</div>
      <div>Batches: </div>
      <div>
        {sendBatches.map((batch, i) => {
          const text = getDisplayForBatch(batch, i);
          let btnText = "Send batch " + (i + 1);
          let btnDisabled = false;
          if (nextBatchSendIndex > i) {
            btnText = "Sent succesfully";
            btnDisabled = true;
          }
          if (waitingForTx && nextBatchSendIndex == i) {
            btnText = "Waiting for tx to be mined...";
            btnDisabled = true;
          }
          return (
            <div key={i}>
              <input
                type="text"
                disabled={true}
                value={text}
                style={{ width: "800px" }}
              ></input>
              <input
                type="button"
                value={btnText}
                disabled={nextBatchSendIndex !== i || btnDisabled}
                onClick={() => sendBatch(i)}
              ></input>
            </div>
          );
        })}
      </div>
    </div>
  );
}
