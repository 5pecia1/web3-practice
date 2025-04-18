"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState(null); // 전송 결과 해시 저장용

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask를 설치해주세요.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      console.log("지갑 연결 성공:", accounts[0]);
    } catch (error) {
      if (error.code === 4001) {
        console.log("사용자가 지갑 연결을 취소했습니다.");
      } else {
        console.error(error);
      }
    }
  }

  async function sendEther() {
    if (!window.ethereum) return alert("MetaMask가 필요합니다!");
    if (!currentAccount) return alert("먼저 지갑을 연결하세요.");
    try {
      if (!ethers.isAddress(toAddress))
        return alert("올바른 지갑 주소를 입력하세요.");
      if (amount === "" || isNaN(Number(amount)))
        return alert("올바른 이더 금액을 입력하세요.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });
      console.log("트랜잭션 전송 완료:", tx.hash);
      setTxHash(tx.hash); // 상태 업데이트
      alert(`트랜잭션 전송 성공!
Tx 해시: ${tx.hash}`);
      // 입력 필드 초기화
      setToAddress("");
      setAmount("");
    } catch (error) {
      setTxHash(null); // 실패 시 해시 초기화
      if (error.code === 4001) {
        console.log("사용자가 전송을 취소했습니다.");
        alert("전송이 취소되었습니다.");
      } else {
        console.error(error);
        alert("전송 실패: " + (error.data?.message || error.message || error));
      }
    }
  }

  return (
    <div className="p-4 min-h-screen bg-slate-50">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">DApp 예제</h1>
      {!currentAccount ? (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          지갑 연결
        </button>
      ) : (
        <div className="mt-6 p-4 border rounded shadow-md bg-white">
          <h3 className="text-lg font-semibold mb-3 text-slate-800">이더 전송하기</h3>
          <input
            type="text"
            placeholder="받는 지갑 주소 (0x...)"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-indigo-400 outline-none text-slate-800"
          />
          <input
            type="text"
            placeholder="전송 ETH 양 (예: 0.1)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded mb-3 focus:ring-2 focus:ring-indigo-400 outline-none text-slate-800"
          />
          <button
            onClick={sendEther}
            className="w-full px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={!toAddress || !amount}
          >
            전송
          </button>
          {txHash && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-400 rounded text-sm">
              <p className="text-slate-700">마지막 전송 해시:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline break-all"
              >
                {txHash}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}