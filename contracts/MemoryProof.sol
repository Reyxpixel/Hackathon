// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MemoryProof {
    struct MemoryRecord {
        address user;
        string npcId;
        bytes32 memoryHash;
        uint256 timestamp;
    }

    MemoryRecord[] public records;

    function storeMemory(string calldata npcId, bytes32 memoryHash) external {
        records.push(MemoryRecord(msg.sender, npcId, memoryHash, block.timestamp));
    }

    function getRecord(uint index) external view returns (address, string memory, bytes32, uint256) {
        MemoryRecord memory rec = records[index];
        return (rec.user, rec.npcId, rec.memoryHash, rec.timestamp);
    }
}
