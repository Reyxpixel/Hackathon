const fs = require('fs');
const path = require('path');

const memoryFile = path.join(__dirname, 'elder_sage_memory.json');

// Load existing memory or create a new one
function loadMemory() {
  if (fs.existsSync(memoryFile)) {
    const data = fs.readFileSync(memoryFile, 'utf-8');
    return JSON.parse(data);
  } else {
    return {
      npcId: "elder_sage",
      personality: {
        traits: ["wise", "philosophical", "calm"],
        mood: "thoughtful"
      },
      interactions: [],
      shared_learning: []
    };
  }
}

// Add a new conversation interaction
function addInteraction(memory, userId, conversation, learnedTraits = [], moodShift = null) {
  const interaction = {
    userId,
    timestamp: new Date().toISOString(),
    conversation,
    learned_traits: learnedTraits,
    mood_shift: moodShift
  };

  memory.interactions.push(interaction);
}

// Save memory JSON to file
function saveMemory(memory) {
  const jsonString = JSON.stringify(memory, null, 2);
  fs.writeFileSync(memoryFile, jsonString, 'utf-8');
  console.log('Memory saved!');
}

// Example usage
function main() {
  const memory = loadMemory();

  // Example conversation
  const conversation = [
    { speaker: "npc", message: "Greetings, traveler. What wisdom do you seek today?" },
    { speaker: "user", message: "I want to understand patience." },
    { speaker: "npc", message: "Patience is the companion of wisdom." }
  ];

  addInteraction(memory, "user123", conversation, ["empathy"], "inspired");

  saveMemory(memory);
}

main();
