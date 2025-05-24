// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NPCTraitStorage {
    struct NPCTraits {
        string name;               // IMMUTABLE (e.g., "Wanda")
        string description;        // IMMUTABLE
        string modelPath;          // IMMUTABLE
        string startingPrompt;     // IMMUTABLE
        string personality;        // Mutable (e.g., "mystical, wise")
        string attributes;         // Mutable, comma-separated (e.g., "Mystical,Wise")
        uint256 experienceLevel;   // Mutable
        uint256 lastUpdated;       // Mutable
    }
    
    mapping(string => NPCTraits) public npcTraits;
    mapping(string => bool) public npcExists;
    
    event NPCCreated(
        string indexed npcId,
        string name,
        string description,
        string modelPath,
        string startingPrompt
    );
    
    event TraitsUpdated(string indexed npcId, uint256 experienceLevel, uint256 timestamp);
    
    // ✅ CREATE NPC: Set immutable fields
    function createNPC(
        string memory npcId,
        string memory name,
        string memory description,
        string memory modelPath,
        string memory startingPrompt,
        string memory personality,
        string memory attributes
    ) external {
        require(!npcExists[npcId], "NPC already exists");
        
        npcTraits[npcId] = NPCTraits(
            name,
            description,
            modelPath,
            startingPrompt,
            personality,
            attributes,
            1, // Initial experienceLevel
            block.timestamp
        );
        
        npcExists[npcId] = true;
        emit NPCCreated(npcId, name, description, modelPath, startingPrompt);
    }
    
    // ✅ UPDATE TRAITS: Modify mutable fields
    function updateTraits(
        string memory npcId,
        string memory personality,
        string memory attributes,
        uint256 experienceLevel
    ) external {
        require(npcExists[npcId], "NPC does not exist");
        
        NPCTraits storage traits = npcTraits[npcId];
        traits.personality = personality;
        traits.attributes = attributes;
        traits.experienceLevel = experienceLevel;
        traits.lastUpdated = block.timestamp;
        
        emit TraitsUpdated(npcId, experienceLevel, block.timestamp);
    }
    
    // ✅ GET TRAITS: Retrieve all traits
    function getTraits(string memory npcId) external view returns (NPCTraits memory) {
        require(npcExists[npcId], "NPC does not exist");
        return npcTraits[npcId];
    }
}
