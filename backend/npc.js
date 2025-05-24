const { Web3 } = require('web3');
const { GreenfieldSDK } = require('@bnb-chain/greenfield-js-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class NPC {
  constructor(id, config) {
    this.id = id;
    this.memoryPath = path.join(__dirname, 'npc_memory', `${id}.json`);
    this.permanentTraits = {};
    this.temporaryTraits = {};
    this.interactionHistory = [];
    
    // Blockchain setup
    this.web3 = config.web3;
    this.contract = new this.web3.eth.Contract(
      config.contractABI,
      config.contractAddress
    );
    this.greenfield = config.greenfield;
    this.wallet = config.wallet;
    
    this.loadLocalMemory();
  }

  loadLocalMemory() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
        this.temporaryTraits = data.temporaryTraits || {};
        this.interactionHistory = data.interactionHistory || [];
      }
    } catch (error) {
      console.error(`Failed to load local memory for ${this.id}:`, error);
    }
  }

  saveLocalMemory() {
    try {
      const data = {
        npcId: this.id,
        permanentTraits: this.permanentTraits,
        temporaryTraits: this.temporaryTraits,
        interactionHistory: this.interactionHistory,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save local memory for ${this.id}:`, error);
    }
  }

  async syncTraitsFromBlockchain() {
    try {
      console.log(`[${this.id}] Syncing traits from blockchain...`);
      const traits = await this.contract.methods.getTraits(this.id).call();
      
      this.permanentTraits = {
        name: traits.name || this.id,
        description: traits.description || '',
        modelPath: traits.modelPath || '',
        startingPrompt: traits.startingPrompt || '',
        personality: traits.personality || '',
        attributes: traits.attributes ? traits.attributes.split(',') : []
      };

      console.log(`[${this.id}] Synced traits:`, this.permanentTraits);
      this.saveLocalMemory();
      
      return this.permanentTraits;
    } catch (error) {
      console.error(`Failed to sync traits for ${this.id}:`, error);
      // Default traits if blockchain fetch fails
      this.permanentTraits = {
        corePersonality: 'Neutral',
        learningStyle: 'Adaptive',
        adaptability: 50,
        moralAlignment: 'Neutral',
        experienceLevel: 1,
        lastUpdated: Date.now()
      };
    }
  }

  async processInteraction(messages, llmClient) {
    const lastMessage = messages[messages.length - 1].content;
    console.log(`[${this.id}] Processing: "${lastMessage}"`);
    
    // Classify the input
    const classification = await llmClient.classifyInput(lastMessage);
    
    // Update temporary traits (session-only)
    this.temporaryTraits = {
      currentMood: classification.temporaryTraits[0] || 'Curious',
      conversationFocus: classification.temporaryTraits[1] || 'General',
      sessionContext: messages.length,
      lastInteraction: Date.now()
    };

    // Store interaction in history
    const interaction = {
      input: lastMessage,
      response: "[pending]",
      classification,
      timestamp: Date.now()
    };
    this.interactionHistory.push(interaction);

    // Determine if permanent traits need updating
    const shouldUpdate = this.shouldUpdateTraits(classification);
    
    if (shouldUpdate) {
      this.updatePermanentTraits(classification);
      await this.storeTraitsOnBlockchain();
    }

    // Store interaction on Greenfield
    await this.storeInteractionOnGreenfield({
      messages,
      classification,
      permanentTraits: this.permanentTraits,
      temporaryTraits: this.temporaryTraits,
      timestamp: new Date().toISOString()
    });

    // Generate AI response using current traits
    const reply = await llmClient.chatCompletion(messages, {
      permanentTraits: this.permanentTraits,
      temporaryTraits: this.temporaryTraits,
      classification
    });

    // Update interaction with actual response
    interaction.response = reply;
    this.saveLocalMemory();
    
    console.log(`[${this.id}] Generated response: "${reply}"`);
    return reply;
  }

  shouldUpdateTraits(classification) {
    // Update traits every 5 interactions or if significant change detected
    return classification.permanentTraits.length > 0 || 
           this.temporaryTraits.sessionContext % 5 === 0;
  }

  updatePermanentTraits(classification) {
    // Gradual trait evolution based on interactions
    if (classification.permanentTraits.includes('Empathetic')) {
      this.permanentTraits.corePersonality = 'Empathetic';
    }
    if (classification.permanentTraits.includes('Analytical')) {
      this.permanentTraits.learningStyle = 'Analytical';
    }
    
    // Increase adaptability and experience
    this.permanentTraits.adaptability = Math.min(
      this.permanentTraits.adaptability + 1, 
      100
    );
    this.permanentTraits.experienceLevel += 1;
    this.permanentTraits.lastUpdated = Date.now();
    
    console.log(`[${this.id}] Updated permanent traits:`, this.permanentTraits);
  }

  async storeTraitsOnBlockchain() {
    try {
      console.log(`[${this.id}] Storing traits on blockchain...`);
      
      const tx = await this.contract.methods.updateTraits(
        this.id,
        this.permanentTraits.corePersonality,
        this.permanentTraits.learningStyle,
        this.permanentTraits.adaptability,
        this.permanentTraits.moralAlignment,
        this.permanentTraits.experienceLevel
      ).send({ 
        from: this.wallet.address,
        gas: 3000000 
      });
      
      console.log(`[${this.id}] Traits updated on blockchain. TX: ${tx.transactionHash}`);
      return tx;
    } catch (error) {
      console.error(`Failed to update traits for ${this.id}:`, error);
      throw error;
    }
  }

  async storeInteractionOnGreenfield(interaction) {
    try {
      const objectName = `interactions/${this.id}/${Date.now()}.json`;
      
      await this.greenfield.object.createObject({
        bucketName: process.env.GREENFIELD_BUCKET,
        objectName,
        body: JSON.stringify(interaction),
        visibility: 'PRIVATE'
      });
      
      console.log(`[${this.id}] Interaction stored on Greenfield: ${objectName}`);
    } catch (error) {
      console.error(`Failed to store interaction for ${this.id}:`, error);
    }
  }

  getMemorySnapshot() {
    return {
      npcId: this.id,
      permanentTraits: this.permanentTraits,
      temporaryTraits: this.temporaryTraits,
      recentInteractions: this.interactionHistory.slice(-5),
      totalInteractions: this.interactionHistory.length
    };
  }
}

module.exports = NPC;
