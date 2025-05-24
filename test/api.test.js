const request = require('supertest');
const app = require('../index'); // Adjust path if needed

describe('NPC API Endpoints', () => {
  // Test /chat endpoint
  it('should return a persona-driven reply from /chat', async () => {
    const res = await request(app)
      .post('/chat')
      .send({
        npcId: 'npc1',
        messages: [
          { role: 'user', content: 'Hello, who are you?' }
        ]
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(typeof res.body.reply).toBe('string');
  });

  // Test /traits/:npcId endpoint
  it('should fetch traits for an NPC', async () => {
    const res = await request(app).get('/traits/npc1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('corePersonality');
    expect(res.body).toHaveProperty('learningStyle');
  });

  // Test /storeMemory endpoint
  it('should store memory and return object info', async () => {
    const res = await request(app)
      .post('/storeMemory')
      .send({
        npcId: 'npc1',
        memory: { sample: 'test memory' }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('objectName');
    expect(res.body).toHaveProperty('hash');
  });

  // Test /fetchMemory/:npcId endpoint
  it('should fetch the latest memory for an NPC', async () => {
    const res = await request(app).get('/fetchMemory/npc1');
    // Accept either 200 (found) or 404 (not found yet)
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.memory).toBeDefined();
      expect(res.body.metadata).toBeDefined();
    }
  });
});
