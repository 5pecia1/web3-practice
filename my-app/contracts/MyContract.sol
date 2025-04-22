// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // 1. 구조체 정의
    struct Person {
        string name;
        uint age;
    }

    // 2. 매핑 선언
    mapping(address => Person) public people; // 주소 -> Person 매핑
    mapping(address => bool) public registered; // 등록 여부 추적

    // 3. 이벤트 정의
    event Registered(address indexed user, string name, uint age);

    // 4. 회원 등록 함수
    function register(string memory _name, uint _age) public {
        // 중복 등록 방지
        require(!registered[msg.sender], "Already registered");

        // 구조체 생성 및 저장
        people[msg.sender] = Person(_name, _age);
        registered[msg.sender] = true;

        // 이벤트 발생
        emit Registered(msg.sender, _name, _age);
    }

    // 5. 정보 조회 함수
    function getMyInfo() public view returns (string memory, uint) {
        // 등록된 사용자만 조회 가능
        require(registered[msg.sender], "Not registered");

        Person memory p = people[msg.sender];
        return (p.name, p.age);
    }
}
