const API_URL = "https://api.upbit.com/v1/ticker?markets=";
const MARKETS = ["KRW-BTC", "KRW-ETH"];

async function fetchPrice() {
  try {
    // API에 비트코인과 이더리움 가격 요청
    const response = await fetch(API_URL + MARKETS.join(","));
    const data = await response.json();

    // 비트코인과 이더리움 가격 정보 추출
    const bitcoinData = data.find((item) => item.market === "KRW-BTC");
    const ethereumData = data.find((item) => item.market === "KRW-ETH");

    // DOM에 가격 표시 업데이트
    const bitcoinPriceElement = document.getElementById("bitcoin-price");
    const ethereumPriceElement = document.getElementById("ethereum-price");

    bitcoinPriceElement.innerText = bitcoinData.trade_price.toLocaleString();
    ethereumPriceElement.innerText = ethereumData.trade_price.toLocaleString();
  } catch (error) {
    console.error("가격 불러오기 오류:", error);
  }
}

fetchPrice();

setInterval(fetchPrice, 1 * 1000);