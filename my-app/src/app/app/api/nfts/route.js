// api/nfts/route.js
import { NextResponse } from "next/server";
import { Alchemy, Network } from "alchemy-sdk";

// API Route Handler: GET /api/nfts?contractAddress=<address>
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get("contractAddress");

  // 1. Validate Contract Address
  if (!contractAddress) {
    return NextResponse.json(
      { error: "컨트랙트 주소가 필요합니다." },
      { status: 400 }
    );
  }

  // 2. Get Alchemy API Key from Environment Variables
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error("ALCHEMY_API_KEY 환경 변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서버 설정 오류입니다. 관리자에게 문의하세요." },
      { status: 500 } // Internal Server Error
    );
  }

  // 3. Configure Alchemy SDK
  const config = {
    apiKey: apiKey,
    network: Network.ETH_SEPOLIA,
  };
  const alchemy = new Alchemy(config);

  // 4. Fetch NFTs using Alchemy SDK
  try {
    console.log(`컨트랙트 주소 [${contractAddress}]의 NFT를 조회합니다...`);
    // getNftsForContract는 자동으로 페이징 처리를 포함하여 해당 컨트랙트의 모든 NFT를 가져옵니다.
    const response = await alchemy.nft.getNftsForContract(contractAddress);
    console.log(`총 ${response.nfts.length}개의 NFT를 찾았습니다.`);

    // 5. Return the NFTs
    return NextResponse.json({ nfts: response.nfts });
  } catch (error) {
    console.error("Alchemy API 호출 중 오류 발생:", error);
    // 에러 객체에 따라 더 구체적인 메시지 제공 가능
    let errorMessage = "NFT 데이터를 가져오는 데 실패했습니다.";
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // Internal Server Error
    );
  }
}