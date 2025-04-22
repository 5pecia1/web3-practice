"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Link from "next/link";

// MyToken (ERC721) ABI - NFT 표시에 필요한 함수들
const nftABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external",
];

// 참고: 실제 NFT 컨트랙트 주소로 교체하세요
const nftContractAddress = "0xd16c21Ede4c504ED2caBd8D9e2Abd0E274667C90"; // 현재는 ERC20과 동일하다고 가정

export default function MyPage() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [allNfts, setAllNfts] = useState([]); // 전체 컨트랙트 NFT 목록
  const [isGalleryLoading, setIsGalleryLoading] = useState(false); // 갤러리 로딩 상태
  const [galleryError, setGalleryError] = useState(null); // 갤러리 에러 상태

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferToAddress, setTransferToAddress] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // 토큰 URI에서 메타데이터를 가져오는 함수
  const fetchMetadata = async (uri) => {
    if (!uri) return null;
    // 잠재적인 IPFS URI 처리
    const gatewayUri = uri.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${uri.split("ipfs://")[1]}`
      : uri;
    try {
      const response = await fetch(gatewayUri);
      if (!response.ok) {
        console.error(
          `Failed to fetch metadata from ${gatewayUri}: ${response.statusText}`
        );
        return {
          name: "메타데이터 오류",
          description: "세부 정보를 불러올 수 없습니다.",
          image: "",
        }; // 기본 오류 메타데이터 제공
      }
      return await response.json();
    } catch (e) {
      console.error(`Error fetching metadata from ${gatewayUri}:`, e);
      return {
        name: "가져오기 오류",
        description: "세부 정보를 불러올 수 없습니다.",
        image: "",
      }; // 기본 오류 메타데이터 제공
    }
  };

  // 소유한 NFT를 가져오는 함수
  const fetchOwnedNFTs = useCallback(async (contract, account) => {
    if (!contract || !account) return;

    setIsLoading(true);
    setError(null);
    setOwnedNFTs([]); // 이전 NFT 목록 지우기

    try {
      const balance = await contract.balanceOf(account);
      const nftPromises = [];

      for (let i = 0; i < balance; i++) {
        nftPromises.push(
          (async () => {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(account, i);
              const tokenUri = await contract.tokenURI(tokenId);
              const metadata = await fetchMetadata(tokenUri);
              // 메타데이터 내 이미지의 잠재적인 IPFS URI 처리
              let imageUrl = metadata?.image || "";
              if (imageUrl.startsWith("ipfs://")) {
                imageUrl = `https://ipfs.io/ipfs/${
                  imageUrl.split("ipfs://")[1]
                }`;
              }
              return {
                id: tokenId.toString(),
                uri: tokenUri,
                metadata: { ...metadata, image: imageUrl },
              };
            } catch (tokenError) {
              console.error(
                `Error fetching details for token at index ${i}:`,
                tokenError
              );
              return null; // 특정 토큰 오류 시 null 반환
            }
          })()
        );
      }

      const resolvedNfts = (await Promise.all(nftPromises)).filter(
        (nft) => nft !== null
      ); // 오류로 인한 null 값 필터링
      setOwnedNFTs(resolvedNfts);
      console.log("소유한 NFT 목록:", resolvedNfts);
    } catch (err) {
      console.error("NFT 잔액 또는 토큰 가져오기 오류:", err);
      setError(
        "NFT를 가져오는데 실패했습니다. 컨트랙트 주소가 올바르고 올바른 네트워크에 연결되어 있는지 확인하세요."
      );
      setOwnedNFTs([]); // 오류 발생 시 NFT 목록 지우기
    } finally {
      setIsLoading(false);
    }
  }, []); // contract와 account가 인수로 전달되므로 의존성 필요 없음

  // 지갑 연결 함수
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask를 설치해주세요.");
      setError("MetaMask가 감지되지 않았습니다.");
      return;
    }
    setError(null);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      setCurrentAccount(account);
      console.log("지갑 연결 성공:", account);

      // NFT 컨트랙트 초기화
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // Write access는 signer 필요
      const contract = new ethers.Contract(nftContractAddress, nftABI, signer); // 쓰기 작업이 필요하므로 signer 사용
      setNftContract(contract);

      // 연결된 계정의 NFT 가져오기
      fetchOwnedNFTs(contract, account);
    } catch (error) {
      if (error.code === 4001) {
        console.log("사용자가 지갑 연결을 취소했습니다.");
        setError("사용자가 지갑 연결을 거부했습니다.");
      } else {
        console.error("지갑 연결 오류:", error);
        setError("지갑 연결에 실패했습니다.");
      }
      setCurrentAccount(null);
      setNftContract(null);
      setOwnedNFTs([]);
    }
  }

  // 계정 변경 처리 Effect (예: MetaMask에서 계정 전환)
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        console.log("지갑 연결 해제됨");
        setCurrentAccount(null);
        setNftContract(null);
        setOwnedNFTs([]);
        setError("지갑 연결이 끊어졌습니다. 다시 연결해주세요.");
      } else if (accounts[0] !== currentAccount) {
        console.log("계정 변경 감지:", accounts[0]);
        // 새 계정에 대해 다시 연결하거나 데이터 새로고침
        connectWallet(); // 연결 및 데이터 가져오기 다시 실행
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // 리스너 제거를 위한 정리 함수
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [currentAccount]); // currentAccount 변경 시 Effect 재실행

  useEffect(() => {
    const fetchAllNfts = async () => {
      setIsGalleryLoading(true);
      setGalleryError(null);
      setAllNfts([]); // 시작 시 초기화
      try {
        // API 라우트 호출 (컨트랙트 주소 전달)
        const response = await fetch(
          `/api/nfts?contractAddress=${nftContractAddress}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
        const data = await response.json();
        setAllNfts(data.nfts || []); // API 응답에서 nfts 배열 사용
        console.log("전체 컨트랙트 NFT:", data.nfts);
      } catch (err) {
        console.error("전체 NFT 갤러리 로딩 오류:", err);
        setGalleryError(
          `전체 NFT 목록을 불러오는데 실패했습니다: ${err.message}`
        );
        setAllNfts([]);
      } finally {
        setIsGalleryLoading(false);
      }
    };

    fetchAllNfts(); // 컴포넌트 마운트 시 함수 실행
  }, []); // 빈 의존성 배열: 마운트 시 한 번만 실행

  const handleTransferClick = (tokenId) => {
    setTransferTokenId(tokenId);
    setTransferToAddress("");
    setTransferError(null);
    setTransferSuccess(false);
    setIsTransferModalOpen(true);
  };

  const handleTransferClose = () => {
    setIsTransferModalOpen(false);
    setTransferTokenId("");
    setTransferToAddress("");
    setTransferError(null);
    setTransferSuccess(false);
  };

  const transferNFT = async () => {
    if (!transferToAddress || !ethers.isAddress(transferToAddress)) {
      setTransferError("유효한 이더리움 주소를 입력해주세요.");
      return;
    }

    if (!transferTokenId) {
      setTransferError("유효한 토큰 ID가 필요합니다.");
      return;
    }

    if (!nftContract || !currentAccount) {
      setTransferError(
        "지갑이 연결되어 있지 않거나 컨트랙트가 초기화되지 않았습니다."
      );
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);

    try {
      console.log(
        `NFT 전송 시작: ${currentAccount} -> ${transferToAddress}, 토큰 ID: ${transferTokenId}`
      );

      // 전송 실행
      const transferTx = await nftContract.safeTransferFrom(
        currentAccount,
        transferToAddress,
        transferTokenId
      );

      await transferTx.wait();
      console.log("NFT 전송 완료:", transferTx.hash);

      setTransferSuccess(true);

      // NFT 목록 새로고침
      setTimeout(() => {
        fetchOwnedNFTs(nftContract, currentAccount);
      }, 2000); // 블록체인 업데이트를 위한 짧은 지연
    } catch (err) {
      console.error("NFT 전송 오류:", err);
      setTransferError(`NFT 전송에 실패했습니다: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="p-4 min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">나의 NFT</h1>
      </div>

      {!currentAccount ? (
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          NFT를 보려면 지갑 연결
        </button>
      ) : (
        <div className="mt-6">
          <div className="mb-6 p-4 bg-indigo-50 rounded shadow">
            <p className="text-slate-700 font-medium">연결된 지갑:</p>
            <p className="text-slate-900 break-all">{currentAccount}</p>
            <button
              onClick={() => fetchOwnedNFTs(nftContract, currentAccount)}
              disabled={isLoading}
              className="mt-3 px-4 py-1.5 bg-indigo-200 text-indigo-800 rounded hover:bg-indigo-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "새로고침 중..." : "NFT 새로고침"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              오류: {error}
            </div>
          )}

          <h2 className="text-2xl font-semibold mb-4 text-slate-800">
            나의 NFT 컬렉션
          </h2>

          {isLoading ? (
            <p className="text-slate-600">NFT 로딩 중...</p>
          ) : ownedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {ownedNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className="border rounded-lg shadow-md overflow-hidden bg-white"
                >
                  {nft.metadata?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nft.metadata.image}
                      alt={nft.metadata?.name || `NFT ${nft.id}`}
                      className="w-full h-48 object-cover" // 높이 조정
                      onError={(e) => {
                        e.target.style.display =
                          "none"; /* 오류 시 이미지 숨김 */
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                      이미지 없음
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {nft.metadata?.name || `토큰 ID: ${nft.id}`}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2 truncate">
                      {nft.metadata?.description || "설명 없음"}
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                      토큰 ID: {nft.id}
                    </p>
                    {/* 선택적으로 토큰 URI 표시 */}
                    {/* <p className="text-xs text-slate-500 mt-1 break-all">URI: {nft.uri}</p> */}

                    {/* 전송 버튼 추가 */}
                    <button
                      onClick={() => handleTransferClick(nft.id)}
                      className="mt-3 w-full px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
                    >
                      NFT 전송하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">
              이 컬렉션에 소유한 NFT가 없거나 로드하지 못했습니다.
            </p>
          )}
        </div>
      )}

      <hr className="my-10 border-t border-slate-300" />

      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">
          컨트랙트 전체 NFT 갤러리 (Alchemy)
        </h2>

        {galleryError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            갤러리 로딩 오류: {galleryError}
          </div>
        )}

        {isGalleryLoading ? (
          <p className="text-slate-600">전체 NFT 갤러리 로딩 중 (Alchemy)...</p>
        ) : allNfts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allNfts.map((nft) => {
              // Alchemy SDK는 종종 media 필드에 바로 사용 가능한 URL(gateway)을 제공합니다.
              console.log(nft);
              const imageUrl = nft.image.originalUrl;
              // IPFS 처리 (Alchemy가 gateway URL을 제공하지 않은 경우)
              const displayImageUrl = imageUrl.startsWith("ipfs://")
                ? `https://ipfs.io/ipfs/${imageUrl.split("ipfs://")[1]}`
                : imageUrl;

              return (
                <div
                  key={`${nft.contract.address}-${nft.tokenId}`}
                  className="border rounded-lg shadow-md overflow-hidden bg-white"
                >
                  {displayImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImageUrl}
                      alt={nft.title || `NFT ${nft.tokenId}`}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = "";
                        e.target.alt = "이미지 로드 실패";
                        e.target.style.display =
                          "none"; /* 간단한 이미지 오류 처리 */
                      }}
                      loading="lazy" // 이미지 지연 로딩
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                      이미지 없음
                    </div>
                  )}
                  <div className="p-4">
                    <h3
                      className="text-lg font-semibold text-slate-800 mb-1"
                      title={nft.title || `토큰 ID: ${nft.tokenId}`}
                    >
                      {nft.title || `토큰 ID: ${nft.tokenId}`}
                    </h3>
                    <p
                      className="text-sm text-slate-600 mb-2 truncate"
                      title={nft.description || "설명 없음"}
                    >
                      {nft.description || "설명 없음"}
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                      토큰 ID: {nft.tokenId}
                    </p>
                    {/* 소유자 정보 (선택적) - getNftsForContract에는 보통 소유자 정보가 없음 */}
                    {/* nft.owners && <p className="text-xs text-slate-500 break-all">소유자: {nft.owners[0]}</p> */}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-600">
            {galleryError
              ? "오류로 인해 갤러리를 표시할 수 없습니다."
              : "이 컨트랙트에는 표시할 NFT가 없거나 로드할 수 없습니다."}
          </p>
        )}
      </div>

      {/* --- 전송 모달 --- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleTransferClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              NFT 전송
            </h3>
            <p className="text-gray-700 mb-2">
              토큰 ID: <span className="font-medium">{transferTokenId}</span>
            </p>

            <div className="mb-4">
              <label
                htmlFor="toAddress"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                받는 주소
              </label>
              <input
                type="text"
                id="toAddress"
                value={transferToAddress}
                onChange={(e) => setTransferToAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-black"
                disabled={isTransferring || transferSuccess}
              />
            </div>

            {transferError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {transferError}
              </div>
            )}

            {transferSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                NFT가 성공적으로 전송되었습니다!
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleTransferClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={isTransferring}
              >
                취소
              </button>
              <button
                onClick={transferNFT}
                disabled={
                  isTransferring || !transferToAddress || transferSuccess
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? "처리 중..." : "전송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}