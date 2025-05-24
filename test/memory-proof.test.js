const MemoryProof = artifacts.require("MemoryProof");

contract("MemoryProof", (accounts) => {
  const npcId1 = "npc-001";
  const npcId2 = "npc-002";
  const memoryHash1 = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const memoryHash2 = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  let instance;

  before(async () => {
    instance = await MemoryProof.deployed();
  });

  it("should store and retrieve a memory record", async () => {
    await instance.storeMemory(npcId1, memoryHash1, { from: accounts[0] });
    const record = await instance.getRecord(0);
    assert.equal(record[1], npcId1, "npcId does not match");
    assert.equal(record[2], memoryHash1, "memoryHash does not match");
    assert.equal(record[0], accounts[0], "user address does not match");
  });

  it("should store and retrieve multiple records", async () => {
    await instance.storeMemory(npcId2, memoryHash2, { from: accounts[1] });
    const record1 = await instance.getRecord(1);
    assert.equal(record1[1], npcId2, "Second npcId does not match");
    assert.equal(record1[2], memoryHash2, "Second memoryHash does not match");
    assert.equal(record1[0], accounts[1], "Second user address does not match");
  });

  it("should revert when accessing an invalid index", async () => {
    try {
      await instance.getRecord(100); // Assuming less than 100 records exist
      assert.fail("Expected error not received");
    } catch (err) {
      assert(
        err.message.includes("revert") || err.message.includes("out of bounds"),
        "Expected revert error"
      );
    }
  });

  it("should store and retrieve a record with empty npcId", async () => {
    await instance.storeMemory("", memoryHash1, { from: accounts[2] });
    const record = await instance.getRecord(2);
    assert.equal(record[1], "", "Empty npcId should be stored and retrieved");
    assert.equal(record[2], memoryHash1, "memoryHash does not match");
    assert.equal(record[0], accounts[2], "user address does not match");
  });

  // Uncomment the following if your contract emits events
  // it("should emit an event when storing memory", async () => {
  //   const tx = await instance.storeMemory("npc-evt", memoryHash2, { from: accounts[3] });
  //   assert(tx.logs.length > 0, "No event was emitted");
  //   // Further checks can be added if you define the event in your contract
  // });
});
