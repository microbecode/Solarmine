import { BigNumber, ethers } from "ethers";
import { getChainByChainId } from "evm-chains";
import { useEffect, useState } from "react";

const isTest = true;

interface Props {
  walletAddress: string;
}

enum Env {
  Local,
  Test,
  Production,
}

const tokenAddresses = {
  Local: "a",
  Test: "b",
  Production: "c",
};

const blacklistedAddresses = {
  Local: ["aa", "aaa"],
  Test: ["bb", "bbb"],
  Production: ["cc", "ccc"],
};

const usedEnv =
  window.location.host.indexOf("localhost") > -1
    ? Env[Env.Local]
    : isTest
    ? Env[Env.Test]
    : Env[Env.Production];

const usedToken = tokenAddresses[usedEnv];
const usedBlacklist = blacklistedAddresses[usedEnv];

export function UI(props: Props) {
  const [usedChainName, setUsedChainName] = useState<string>("");
  const [assetAmount, setAssetAmount] = useState<string>("0");
  //const [weiAmount, setWeiAmount] = useState<string>("0");
  const [simulateOnly, setSimulateOnly] = useState<boolean>(true);

  function isMyNumeric(n) {
    if (!isNaN(parseFloat(n)) && isFinite(n)) {
      let num = +n;
      num = num * 100000;

      if ((num * 10).toString() === num.toString() + "0") {
        return true;
      }
    }
    return false;
  }

  /*   useEffect(() => {
    try {
      const res = isNumeric(assetAmount);
      let num = +res;
      num = num *

      setWeiAmount(
        res.mul(BigNumber.from("10").pow(BigNumber.from("18"))).toString()
      );
    } catch (ex) {
      setWeiAmount("Invalid amount");
    }
  }, [assetAmount]); */

  useEffect(() => {
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
  }, []);

  const confirmSend = () => {
    if (
      isMyNumeric(assetAmount) &&
      window.confirm(
        "Are you sure you want to distribute " + assetAmount + " BNB?"
      )
    ) {
      console.log("yes");
    } else {
      alert("Fix your amount");
    }
  };

  return (
    <div className="create-container pt-5 pb-0 px-5" id="what">
      <div>Used environment: {usedEnv}</div>
      <div>Your wallet: {props.walletAddress}</div>
      <div>Used token: {usedToken}</div>
      <div>Blacklist: {usedBlacklist.join(", ")}</div>
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
    </div>
  );
}
