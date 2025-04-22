"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// MyContract ABI - interface for interacting with the contract
const contractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "age",
        type: "uint256",
      },
    ],
    name: "Registered",
    type: "event",
  },
  {
    inputs: [],
    name: "getMyInfo",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "people",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "age",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_age",
        type: "uint256",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "registered",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = "0x20a9d8EC04b83627262Df49cdeeE108A1bAaF052";

export default function MyEthValue() {
  // 1. 상태 변수 정의 (계정 주소, ETH 잔액, ETH 시세)
  const [account, setAccount] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  // Contract 관련 상태
  const [contract, setContract] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", age: 0 });
  const [formData, setFormData] = useState({ name: "", age: "" });
  const [loading, setLoading] = useState(false);

  // 2. 지갑 연결 및 잔액 조회 함수
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask가 필요합니다.");
      return;
    }
    try {
      // MetaMask 지갑 연결 (사용자에게 계정 접근 요청)
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      // ETH 잔액 조회 (wei 단위 → ether 단위 변환)
      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      setEthBalance(balanceEth);

      // 컨트랙트 연결
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      );
      setContract(contractInstance);

      // 사용자 등록 상태 확인
      await checkRegistrationStatus(contractInstance, address);
    } catch (err) {
      console.error(err);
    }
  };

  // 컨트랙트의 등록 상태 확인
  const checkRegistrationStatus = async (contractInstance, address) => {
    try {
      const registered = await contractInstance.registered(address);
      setIsRegistered(registered);

      if (registered) {
        const info = await contractInstance.getMyInfo();
        setUserInfo({ name: info[0], age: Number(info[1]) });
      }
    } catch (err) {
      console.error("등록 상태 확인 오류:", err);
    }
  };

  // 사용자 등록 함수
  const registerUser = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;

    try {
      setLoading(true);
      const tx = await contract.register(formData.name, parseInt(formData.age));
      await tx.wait();

      // 등록 상태 업데이트
      await checkRegistrationStatus(contract, account);
      setLoading(false);
    } catch (err) {
      console.error("등록 오류:", err);
      setLoading(false);
    }
  };

  // 폼 데이터 변경 처리
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 3. ETH 시세 조회 함수 (Upbit API 호출)
  const fetchEthPrice = async () => {
    try {
      const res = await fetch(
        "https://api.upbit.com/v1/ticker?markets=KRW-ETH"
      );
      const data = await res.json();
      // 응답 데이터 배열의 첫 번째 항목에서 가격 추출
      const price = data[0].trade_price;
      setEthPrice(price);
    } catch (err) {
      console.error(err);
    }
  };

  // 컴포넌트 마운트 시 1초마다 가격을 가져오기
  useEffect(() => {
    // 초기 가격 가져오기
    fetchEthPrice();

    // 1초마다 가격 업데이트
    const intervalId = setInterval(() => {
      fetchEthPrice();
    }, 1000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">이더리움 & 컨트랙트 상호작용</h1>

      {!account ? (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={connectWallet}
        >
          지갑 연결
        </button>
      ) : (
        <div>
          <div className="mb-6 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">지갑 정보</h2>
            <p className="mb-1">
              <span className="font-medium">주소:</span> {account}
            </p>
            <p className="mb-1">
              <span className="font-medium">ETH 잔액:</span> {ethBalance} ETH
            </p>
            <p className="mb-1">
              <span className="font-medium">현재 ETH 가격:</span>{" "}
              {ethPrice ? ethPrice.toLocaleString() : "..."} 원
            </p>
            <p>
              <span className="font-medium">총 자산 가치:</span>{" "}
              {ethPrice && ethBalance
                ? (parseFloat(ethBalance) * ethPrice).toLocaleString()
                : "..."}{" "}
              원
            </p>
          </div>

          <div className="mb-6 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">MyContract 상호작용</h2>

            {isRegistered ? (
              <div>
                <h3 className="text-lg font-medium mb-2">등록 정보</h3>
                <p>
                  <span className="font-medium">이름:</span> {userInfo.name}
                </p>
                <p>
                  <span className="font-medium">나이:</span> {userInfo.age}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">사용자 등록</h3>
                <form onSubmit={registerUser}>
                  <div className="mb-3">
                    <label className="block mb-1">이름:</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1">나이:</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    {loading ? "처리 중..." : "등록하기"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}