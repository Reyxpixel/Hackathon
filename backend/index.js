require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const { Client } = require('@bnb-chain/greenfield-js-sdk');
const NPC = require('./npc');
const llmClient = require('./llmclient');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Blockchain Setup
const web3 = new Web3(process.env.BSC_RPC_URL);
const greenfield = Client.create(
    'https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org',
    '5600'
);

const contractABI = require('./abis/NPCTraitsABI.json');
const contractAddress = process.env.BSC_CONTRACT_ADDRESS;
const npcContract = new web3.eth.Contract(contractABI, contractAddress);

// Wallet Configuration
const wallet = web3.eth.accounts.privateKeyToAccount(process.env.BSC_WALLET_PRIVATE_KEY);
web3.eth.accounts.wallet.add(wallet);

// Create directories if they don't exist
if (!fs.existsSync(path.join(__dirname, 'npc_memory'))) {
    fs.mkdirSync(path.join(__dirname, 'npc_memory'));
}

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'NPChain Backend API is running',
        endpoints: [
            'POST /chat',
            'GET /traits/:npcId',
            'POST /storeMemory',
            'GET /fetchMemory/:npcId'
        ]
    });
});

// Enhanced /chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { npcId, messages } = req.body;
        
        if (!npcId || !messages) {
            return res.status(400).json({ error: 'Missing npcId or messages' });
        }

        const npc = new NPC(npcId, {
            web3,
            greenfield,
            contractABI,
            contractAddress,
            wallet
        });

        await npc.syncTraitsFromBlockchain();
        const reply = await npc.processInteraction(messages, llmClient);
        
        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat processing failed',
            details: error.message
        });
    }
});

// Get NPC traits endpoint
app.get('/traits/:npcId', async (req, res) => {
    try {
        const traits = await npcContract.methods.getTraits(req.params.npcId).call();
        res.json({
            name: traits.name || req.params.npcId,
            description: traits.description || '',
            modelPath: traits.modelPath || '',
            startingPrompt: traits.startingPrompt || '',
            personality: traits.personality || '',
            attributes: traits.attributes ? traits.attributes.split(',') : []
        });
    } catch (error) {
        console.error('Traits fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Store memory endpoint
app.post('/storeMemory', async (req, res) => {
    try {
        const { npcId, memory } = req.body;
        
        if (!npcId || !memory) {
            return res.status(400).json({ error: 'Missing npcId or memory' });
        }

        const objectName = `memory/${npcId}/${Date.now()}.json`;
        await greenfield.object.createObject({
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName,
            body: JSON.stringify({
                npcId,
                memory,
                timestamp: new Date().toISOString()
            }),
            visibility: 'PRIVATE'
        });

        const memoryHash = crypto.createHash('sha256')
            .update(JSON.stringify(memory))
            .digest('hex');

        await npcContract.methods
            .storeMemoryHash(npcId, memoryHash)
            .send({
                from: wallet.address,
                gas: 3000000
            });

        res.json({
            message: 'Memory stored successfully',
            objectName,
            hash: memoryHash
        });
    } catch (error) {
        console.error('Memory storage error:', error);
        res.status(500).json({
            error: 'Memory storage failed',
            details: error.message
        });
    }
});

// Fetch memory endpoint
app.get('/fetchMemory/:npcId', async (req, res) => {
    try {
        const { npcId } = req.params;
        
        const objects = await greenfield.object.listObjects({
            bucketName: process.env.GREENFIELD_BUCKET,
            prefix: `memory/${npcId}/`
        });

        if (!objects || objects.length === 0) {
            return res.status(404).json({ error: 'No memories found for NPC' });
        }

        const latestMemory = objects.sort((a, b) =>
            b.objectName.localeCompare(a.objectName))[0];

        const memoryData = await greenfield.object.getObject({
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName: latestMemory.objectName
        });

        res.json({
            memory: memoryData,
            metadata: {
                objectName: latestMemory.objectName,
                timestamp: latestMemory.createTime
            }
        });
    } catch (error) {
        console.error('Memory fetch error:', error);
        res.status(500).json({
            error: 'Memory retrieval failed',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
