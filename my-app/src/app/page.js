"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function MyEthValue() {
  // 상태 변수 정의
  const [account, setAccount] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  // 지갑 연결 및 잔액 조회 함수
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask가 필요합니다.");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      setEthBalance(balanceEth);
    } catch (err) {
      console.error(err);
    }
  };

  // ETH 시세 조회 함수
  const fetchEthPrice = async () => {
    try {
      const res = await fetch(
        "https://api.upbit.com/v1/ticker?markets=KRW-ETH"
      );
      const data = await res.json();
      const price = data[0].trade_price;
      setEthPrice(price);
    } catch (err) {
      console.error(err);
    }
  };

  // 컴포넌트 마운트 시 가격 가져오기
  useEffect(() => {
    fetchEthPrice();

    const intervalId = setInterval(() => {
      fetchEthPrice();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
          내 이더리움 자산
        </h2>

        {account ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">지갑 주소</p>
              <p className="text-gray-700 font-mono text-sm truncate">
                {account}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-500 mb-1">ETH 잔액</p>
                <p className="text-xl font-semibold text-blue-700">
                  {ethBalance ? parseFloat(ethBalance).toFixed(4) : "0"} ETH
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-500 mb-1">ETH 시세</p>
                <p className="text-xl font-semibold text-green-700">
                  {ethPrice ? ethPrice.toLocaleString() : "..."} 원
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-500 mb-1">총 자산 가치</p>
              <p className="text-2xl font-bold text-purple-700">
                {ethPrice && ethBalance
                  ? (parseFloat(ethBalance) * ethPrice).toLocaleString()
                  : "0"}{" "}
                원
              </p>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              * 가격 데이터는 Upbit API에서 실시간으로 업데이트됩니다
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-gray-600">
              MetaMask 지갑에 연결하여 ETH 자산 가치를 확인하세요
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              지갑 연결하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}