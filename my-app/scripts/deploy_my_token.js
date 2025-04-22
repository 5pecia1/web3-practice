const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Ignition 모듈과 동일한 메타데이터 URL 사용
const metadataUrl =
  "ipfs://bafkreie6tm2zaykd33mc4dbkxr4yozoprpuhg3jcfugdgy3ih5ofkcu3yy";

async function main() {
  // Hardhat 네트워크 정보 가져오기
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`네트워크: ${networkName} (Chain ID: ${chainId})`);

  // Ignition 배포 결과 파일 경로 설정
  const deploymentDir = path.join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    `chain-${chainId}`
  );
  const deployedAddressesPath = path.join(
    deploymentDir,
    "deployed_addresses.json"
  );

  if (!fs.existsSync(deployedAddressesPath)) {
    console.error(
      `오류: 배포된 주소 파일을 찾을 수 없습니다: ${deployedAddressesPath}`
    );
    console.error(
      "먼저 'npx hardhat ignition deploy ./ignition/modules/MyToken.js --network sepolia'를 실행하여 컨트랙트를 배포하세요."
    );
    process.exit(1);
  }

  // 배포된 컨트랙트 주소 읽기
  const deployedAddresses = JSON.parse(
    fs.readFileSync(deployedAddressesPath, "utf8")
  );
  const contractAddress = deployedAddresses["MyTokenModule#MyToken"];

  if (!contractAddress) {
    console.error(
      "오류: deployed_addresses.json 파일에서 'MyTokenModule#MyToken' 주소를 찾을 수 없습니다."
    );
    process.exit(1);
  }

  console.log(`MyToken 배포 주소: ${contractAddress}`);

  // 배포된 컨트랙트 인스턴스 가져오기
  const myToken = await hre.ethers.getContractAt("MyToken", contractAddress);

  // 계정 가져오기
  const signers = await hre.ethers.getSigners();
  const ownerAddress = signers[0].address;
  console.log(`민팅 대상 주소: ${ownerAddress}`);
  console.log(`사용될 메타데이터 URI: ${metadataUrl}`);

  console.log("토큰 민팅 중...");

  try {
    // safeMint 함수 호출 - ERC721 토큰 민팅
    const tx = await myToken.safeMint(ownerAddress, metadataUrl);
    console.log(`트랜잭션 해시: ${tx.hash}`);
    console.log("트랜잭션이 채굴되기를 기다리는 중...");

    // 트랜잭션 완료 기다리기
    const receipt = await tx.wait();
    console.log(`민팅 성공! Gas 사용량: ${receipt.gasUsed.toString()}`);

    // 이벤트에서 Token ID 추출 (Transfer 이벤트 사용)
    let tokenId = null;
    if (receipt.logs) {
      const transferEvent = receipt.logs.find(
        (log) => log.eventName === "Transfer"
      );
      if (transferEvent && transferEvent.args) {
        tokenId = transferEvent.args.tokenId.toString();
        console.log(`민팅된 토큰 ID: ${tokenId}`);
      }
    }

    // 소유자 잔액 확인 (NFT 개수)
    try {
      const balance = await myToken.balanceOf(ownerAddress);
      console.log(`소유자(${ownerAddress})의 토큰 개수: ${balance.toString()}`);
    } catch (error) {
      console.log("잔액 확인 중 오류 발생:", error);
    }

    // tokenURI 확인 (선택 사항)
    if (tokenId !== null) {
      try {
        const uri = await myToken.tokenURI(tokenId);
        console.log(`토큰 ID ${tokenId}의 URI: ${uri}`);
      } catch (error) {
        console.log(`tokenURI(${tokenId}) 호출 중 오류:`, error);
      }
    }

    // 총 토큰 수 확인
    const totalSupply = await myToken.totalSupply();
    console.log(`총 토큰 발행 수: ${totalSupply.toString()}`);
  } catch (error) {
    console.error("민팅 실패:", error);
    if (error.data) {
      console.error("실패 원인 데이터:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });