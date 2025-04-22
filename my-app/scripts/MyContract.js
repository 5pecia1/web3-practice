// my-app/scripts/increment.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Hardhat 네트워크 정보 가져오기 (localhost의 경우 chainId는 31337)
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`네트워크: ${networkName} (Chain ID: ${chainId})`);

  // Ignition 배포 결과 파일 경로 설정
  // 실제 배포 ID는 다를 수 있으므로, 가장 최근 배포 폴더를 찾아야 할 수 있습니다.
  // 여기서는 'chain-<chainId>' 폴더가 있다고 가정합니다.
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
      "먼저 'npx hardhat ignition deploy ./ignition/modules/MyContract.js --network localhost'를 실행하여 컨트랙트를 배포하세요."
    );
    process.exit(1);
  }

  // 배포된 컨트랙트 주소 읽기
  const deployedAddresses = JSON.parse(
    fs.readFileSync(deployedAddressesPath, "utf8")
  );
  const contractAddress = deployedAddresses["MyContractModule#MyContract"];

  if (!contractAddress) {
    console.error(
      "오류: deployed_addresses.json 파일에서 'MyContractModule#MyContract' 주소를 찾을 수 없습니다."
    );
    process.exit(1);
  }

  console.log(`MyContract 배포 주소: ${contractAddress}`);

  // 배포된 컨트랙트 인스턴스 가져오기
  const myContract = await hre.ethers.getContractAt(
    "MyContract",
    contractAddress
  );

  // 1. 사용자 등록 상태 확인
  const signers = await hre.ethers.getSigners();
  const userAddress = signers[0].address;
  console.log(`현재 계정 주소: ${userAddress}`);

  const isRegistered = await myContract.registered(userAddress);
  console.log(`현재 계정 등록 상태: ${isRegistered ? "등록됨" : "미등록"}`);

  // 2. register 함수 호출 (등록되지 않은 경우에만)
    console.log("register 함수 호출 중...");
    const name = "John Doe";
    const age = 30;

    const tx = await myContract.register(name, age);
    console.log(`트랜잭션 해시: ${tx.hash}`);
    console.log("트랜잭션이 채굴되기를 기다리는 중...");

    // 트랜잭션 완료 기다리기
    const receipt = await tx.wait();

    // 이벤트 정보 출력
    const registeredEvent = receipt.logs
      .filter((log) => log.fragment && log.fragment.name === "Registered")
      .map((log) => myContract.interface.parseLog(log))[0];

    if (registeredEvent) {
      console.log("Registered 이벤트 발생:");
      console.log(`주소: ${registeredEvent.args[0]}`);
      console.log(`이름: ${registeredEvent.args[1]}`);
      console.log(`나이: ${registeredEvent.args[2]}`);
    }

    console.log("등록이 성공적으로 완료되었습니다!");

  // 3. getMyInfo 함수 호출하여 정보 조회
  console.log("getMyInfo 함수 호출 중...");
  try {
    const [name, age] = await myContract.getMyInfo();
    console.log("내 정보:");
    console.log(`이름: ${name}`);
    console.log(`나이: ${age}`);
  } catch (error) {
    console.error("정보 조회 실패:", error.message);
  }

  // 4. people 매핑 조회
  console.log("people 매핑 조회 중...");
  try {
    const personInfo = await myContract.people(userAddress);
    console.log("매핑에서 조회한 내 정보:");
    console.log(`이름: ${personInfo[0]}`);
    console.log(`나이: ${personInfo[1]}`);
  } catch (error) {
    console.error("매핑 조회 실패:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });