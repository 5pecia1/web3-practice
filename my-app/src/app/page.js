"use client"; // 클라이언트 컴포넌트 사용 선언
import React, { useEffect, useState } from "react";

export default function UpbitPricesPageTailwind() {
  const [btcPrice, setBtcPrice] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  // Upbit API 주소
  const API_URL = "https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH";

  // 시세 불러오기 함수
  const fetchPrices = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Upbit API 응답에 문제가 있습니다.");
      }
      const data = await response.json();
      const btcData = data.find((item) => item.market === "KRW-BTC");
      const ethData = data.find((item) => item.market === "KRW-ETH");

      if (btcData) setBtcPrice(btcData.trade_price);
      if (ethData) setEthPrice(ethData.trade_price);
    } catch (error) {
      console.error("시세 조회 오류:", error);
      // 사용자에게 에러 메시지를 보여주는 상태 추가 고려
    }
  };

  // 마운트 시점에 1초마다 fetchPrices 실행
  useEffect(() => {
    fetchPrices(); // 초기 로드
    const intervalId = setInterval(fetchPrices, 1000); // 1초 간격 업데이트
    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 정리
  }, []);

  return (
    // Tailwind 클래스로 컨테이너 스타일링
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
      {/* Tailwind 클래스로 제목 스타일링 */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Upbit 시세 조회 (Tailwind CSS)
      </h1>

      {/* Tailwind 클래스로 가격 표시 박스 스타일링 */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          비트코인 (BTC/KRW)
        </h2>
        <p className="text-xl text-blue-600 font-medium">
          {btcPrice !== null ? (
            `${btcPrice.toLocaleString()} 원`
          ) : (
            <span className="text-gray-400">불러오는 중...</span>
          )}
        </p>
      </div>

      {/* Tailwind 클래스로 가격 표시 박스 스타일링 */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          이더리움 (ETH/KRW)
        </h2>
        <p className="text-xl text-green-600 font-medium">
          {ethPrice !== null ? (
            `${ethPrice.toLocaleString()} 원`
          ) : (
            <span className="text-gray-400">불러오는 중...</span>
          )}
        </p>
      </div>
    </div>
  );
}