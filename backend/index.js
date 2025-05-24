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
const os = require('os');

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
<<<<<<< HEAD
    'https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org',
    '5600'
=======
  'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443', // Greenfield RPC endpoint
  '5600' // Chain ID for testnet
>>>>>>> b271429f88e45724f530e9917109ad4530552d46
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

<<<<<<< HEAD
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
=======
// === STATIC FILES SERVING ===
app.use(express.static(path.join(__dirname, '../public')));

// === API ROUTES ===

// Enhanced /chat endpoint with blockchain-first approach
app.post('/api/chat', async (req, res) => {
  try {
    const { npcId, messages } = req.body;
    if (!npcId || !messages) {
      return res.status(400).json({ error: 'Missing npcId or messages' });
    }

    // Always create fresh NPC instance for each query
    const npc = new NPC(npcId, {
      web3,
      greenfield,
      contractABI,
      contractAddress,
      wallet
    });

    // Fetch latest traits from blockchain before processing
    await npc.syncTraitsFromBlockchain();

    // Process the interaction with fresh blockchain data
    const reply = await npc.processInteraction(messages, llmClient);

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Chat processing failed',
      details: error.message
    });
  }
>>>>>>> b271429f88e45724f530e9917109ad4530552d46
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
<<<<<<< HEAD
=======

    const bucketName = process.env.GREENFIELD_BUCKET;
    const objectName = `memory/${npcId}/${Date.now()}.json`;
    const bodyData = JSON.stringify({
      npcId,
      memory,
      timestamp: new Date().toISOString()
    });

    // Step 1: Check if bucket exists
    console.log('Checking if bucket exists:', bucketName);
    const buckets = await greenfield.bucket.listBuckets();
    const exists = buckets.some(b => b.bucketName === bucketName);
    if (!exists) {
      return res.status(400).json({ error: `Bucket ${bucketName} does not exist.` });
    }

    // Step 2: Create object metadata
    console.log('Creating object metadata for:', objectName);
    const createResult = await greenfield.object.createObject({
      bucketName,
      objectName,
      body: bodyData,
      visibility: 'PRIVATE'
    });
    console.log('createObject result:', createResult);

    // Step 3: Upload the actual object data
    console.log('Uploading object data...');
    const putResult = await greenfield.object.putObject({
      bucketName,
      objectName,
      body: bodyData
    });
    console.log('putObject result:', putResult);

    // Step 4: Store hash on chain as before
    const memoryHash = crypto.createHash('sha256')
      .update(bodyData)
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
>>>>>>> b271429f88e45724f530e9917109ad4530552d46
});

// Fetch memory endpoint
app.get('/fetchMemory/:npcId', async (req, res) => {
<<<<<<< HEAD
    try {
        const { npcId } = req.params;
        
        const objects = await greenfield.object.listObjects({
            bucketName: process.env.GREENFIELD_BUCKET,
            prefix: `memory/${npcId}/`
        });
=======
  try {
    const { npcId } = req.params;

    const objects = await greenfield.object.listObjects({
      bucketName: process.env.GREENFIELD_BUCKET,
      prefix: `memory/${npcId}/`
    });
>>>>>>> b271429f88e45724f530e9917109ad4530552d46

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
<<<<<<< HEAD
=======

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
>>>>>>> b271429f88e45724f530e9917109ad4530552d46
});

// === STARTUP: Blockchain Sync Check, then Start Server ===
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
=======
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

(async () => {
  try {
    // Optional: Blockchain node sync check
    // const isSynced = await web3.eth.isSyncing();
    // if (isSynced !== false) {
    //   console.error('Blockchain node not synced! Current status:', isSynced);
    //   process.exit(1);
    // }

    app.listen(PORT, () => {
      console.log('\n=== SERVER STARTED ===');
      console.log(`Local:   http://localhost:${PORT}`);
      console.log(`Network: http://${getIPAddress()}:${PORT}`);
      console.log('========================\n');
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
})();
>>>>>>> b271429f88e45724f530e9917109ad4530552d46
