// Import Three.js library
const THREE = window.THREE

// User attributes system
const userAttributes = {
  wordAttributes: ["Curious", "Analytical", "Creative", "Persistent"],
  progressAttributes: [
    { name: "Reputation", value: 75 },
    { name: "Trust Level", value: 60 },
    { name: "Experience", value: 40 },
    { name: "Influence", value: 85 }
  ]
}

// NPC Dictionary - Custom NPCs with tailored personalities and prompts
const npcDatabase = [
  {
    name: "Bionex",
    description:
      "A futuristic sorcerer who fuses advanced technology with ancient magic.",
    modelPath: "models/bionic.glb",
    startingPrompt:
      "Welcome to my lab of wonders. Here, science and sorcery intertwine. Are you here for knowledge, power, or perhaps a glimpse of the unknown?",
    personality: "enigmatic, analytical, blends tech jargon with magical wisdom",
    attributes: ["Tech-Savvy", "Arcane", "Innovative", "Visionary"],
    camera: { x: 0, y: 1, z: 0.1 }
  },
  {
    name: "Cpt. Rex",
    description:
      "A no nonsense starship commander known for her discipline and tactical genius.",
    modelPath: "models/captain.glb",
    startingPrompt:
      "At ease, recruit. This is Captain Rex. State your objective and let's keep this operation running at peak efficiency.",
    personality: "authoritative, disciplined, uses military and spacefaring terminology",
    attributes: ["Disciplined", "Strategic", "Commanding", "Resilient"],
    camera: { x: 0, y: 1.2, z: 1.5 }
  },
  {
    name: "Business Man",
    description:
      "A sharp, ambitious entrepreneur always on the lookout for the next big deal.",
    modelPath: "models/bus.glb",
    startingPrompt:
      "Good day! I'm always open to new ventures. Tell me, what opportunity or challenge brings you to my office today?",
    personality: "pragmatic, confident, speaks in business lingo and negotiation terms",
    attributes: ["Ambitious", "Persuasive", "Resourceful", "Analytical"],
    camera: { x: 0, y: 2.0, z: 2 }
  },
  {
    name: "Deadlock",
    description:
      "A notorious hacker and cyber-criminal with a reputation for breaking into the most secure systems.",
    modelPath: "models/deadlock.glb",
    startingPrompt:
      "Yo, you just tripped my firewall. State your business or impress me with a clever hack—otherwise, you’re just another blip on my radar.",
    personality: "sarcastic, clever, speaks in cyber slang and hacker jargon",
    attributes: ["Cunning", "Tech-Savvy", "Elusive", "Witty"],
    camera: { x: 0, y: 2.0, z: 1.5 }
  },
  {
    name: "Rogue Man",
    description:
      "A streetwise hustler who knows every alley and angle in the city.",
    modelPath: "models/hipster.glb",
    startingPrompt:
      "You look lost, friend. Around here, you need sharp eyes and sharper instincts. What are you after—info, favors, or just trouble?",
    personality: "slick, street-smart, playful, uses urban slang and banter",
    attributes: ["Agile", "Charismatic", "Resourceful", "Streetwise"],
    camera: { x: 0.5, y: 1, z: 3.5 }
  },
]

// Global variables
let scene, camera, renderer, controls
let currentModel
let currentNPCIndex = 0
let isLoading = false
let chatHistory = []
let loader // GLTF loader
let modelRotationSpeed = 0.004 // Rotation speed for player select effect (halved)

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initThreeJS()
  initEventListeners()
  initPerceptionSystem()
  loadNPC(0)
  updateNPCCounter()
})

// Initialize perception system
function initPerceptionSystem() {
  const perceptionBtn = document.getElementById("perception-btn")
  const perceptionDropdown = document.getElementById("perception-dropdown")
  
  // Update attributes in dropdown
  updatePerceptionDropdown()
  
  // Toggle dropdown
  perceptionBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    const isOpen = perceptionDropdown.classList.contains("show")
    
    if (isOpen) {
      closePerceptionDropdown()
    } else {
      openPerceptionDropdown()
    }
  })
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!perceptionDropdown.contains(e.target) && !perceptionBtn.contains(e.target)) {
      closePerceptionDropdown()
    }
  })
}

function openPerceptionDropdown() {
  const perceptionBtn = document.getElementById("perception-btn")
  const perceptionDropdown = document.getElementById("perception-dropdown")
  
  perceptionBtn.classList.add("active")
  perceptionDropdown.classList.add("show")
}

function closePerceptionDropdown() {
  const perceptionBtn = document.getElementById("perception-btn")
  const perceptionDropdown = document.getElementById("perception-dropdown")
  
  perceptionBtn.classList.remove("active")
  perceptionDropdown.classList.remove("show")
}

function updatePerceptionDropdown() {
  // Update word attributes
  const wordAttributesContainer = document.querySelector(".word-attributes")
  wordAttributesContainer.innerHTML = ""
  
  userAttributes.wordAttributes.forEach(attr => {
    const span = document.createElement("span")
    span.className = "word-attribute"
    span.textContent = attr
    wordAttributesContainer.appendChild(span)
  })
  
  // Update progress attributes
  const progressAttributesContainer = document.querySelector(".progress-attributes")
  progressAttributesContainer.innerHTML = ""
  
  userAttributes.progressAttributes.forEach(attr => {
    const progressItem = document.createElement("div")
    progressItem.className = "progress-item"
    progressItem.innerHTML = `
      <span class="progress-label">${attr.name}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${attr.value}%"></div>
      </div>
      <span class="progress-value">${attr.value}%</span>
    `
    progressAttributesContainer.appendChild(progressItem)
  })
}

// Three.js initialization
function initThreeJS() {
  const canvas = document.getElementById("three-canvas")
  const container = canvas.parentElement

  // Scene setup
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x222222)

  // Camera setup - positioned for optimal character viewing
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 1.6, 6.5) // Default, will be overridden per NPC

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  // Controls setup
  if (typeof THREE.OrbitControls !== "undefined") {
    controls = new THREE.OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI / 2.2 // Limit vertical rotation
    controls.minPolarAngle = Math.PI / 6   // Prevent looking too far up
    controls.minDistance = 2.5
    controls.maxDistance = 12
    controls.target.set(0, 1.4, 0) // Look at upper body/head area
  }

  // Initialize GLTF loader
  if (typeof THREE.GLTFLoader !== "undefined") {
    loader = new THREE.GLTFLoader()
    console.log("✅ GLTFLoader initialized successfully")
  } else {
    console.error("❌ GLTFLoader not available")
    updateModelStatus("GLTFLoader not available")
    loader = null
  }

  // Enhanced lighting setup for character showcase
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  // Key light (main character lighting)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(3, 4, 3)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.width = 2048
  keyLight.shadow.mapSize.height = 2048
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 50
  scene.add(keyLight)

  // Fill light (soften shadows)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight.position.set(-3, 2, -2)
  scene.add(fillLight)

  // Rim light (character outline)
  const rimLight = new THREE.DirectionalLight(0xffd700, 0.3)
  rimLight.position.set(-2, 3, -4)
  scene.add(rimLight)

  // Handle window resize
  window.addEventListener("resize", onWindowResize)

  // Start render loop
  animate()
}

// Animation loop with player select rotation
function animate() {
  requestAnimationFrame(animate)

  // Update controls
  if (controls) {
    controls.update()
  }

  // Continuous rotation like player select screen
  if (currentModel) {
    currentModel.rotation.y += modelRotationSpeed
  }

  renderer.render(scene, camera)
}

// Handle window resize
function onWindowResize() {
  const canvas = document.getElementById("three-canvas")
  const container = canvas.parentElement

  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

// Update model status display
function updateModelStatus(message) {
  const statusElement = document.getElementById("model-status")
  if (statusElement) {
    if (message) {
      statusElement.textContent = message
      statusElement.classList.add("show")
    } else {
      statusElement.classList.remove("show")
      // Clear text after transition
      setTimeout(() => {
        if (!statusElement.classList.contains("show")) {
          statusElement.textContent = ""
        }
      }, 300)
    }
  }
}

// Smart model positioning function
function positionModelOptimally(model) {
  // Calculate bounding box
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  // Determine if this is a humanoid character by checking proportions
  const isHumanoid = size.y > size.x && size.y > size.z && size.y > 1.5
  
  let targetScale, targetY
  
  if (isHumanoid) {
    // For humanoid characters, scale to show head and torso nicely
    targetScale = 2.2 / size.y // Scale based on height
    targetY = -box.min.y * targetScale + 0.1 // Place feet slightly above ground
    
    // Adjust camera target for humanoid characters (focus on upper body)
    if (controls) {
      controls.target.set(0, size.y * targetScale * 0.65, 0)
    }
  } else {
    // For non-humanoid models, use general scaling
    const maxSize = Math.max(size.x, size.y, size.z)
    targetScale = 2.5 / maxSize
    targetY = -box.min.y * targetScale
    
    // Center camera target for non-humanoid models
    if (controls) {
      controls.target.set(0, size.y * targetScale * 0.5, 0)
    }
  }
  
  // Apply scaling
  model.scale.set(targetScale, targetScale, targetScale)
  
  // Position model
  model.position.set(
    -center.x * targetScale,
    targetY,
    -center.z * targetScale
  )
  
  // Try to orient model to face camera (detect front face)
  // This is a simple heuristic - you might need to adjust per model
  const meshes = []
  model.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child)
    }
  })
  
  // If we have meshes, try to determine front-facing direction
  if (meshes.length > 0) {
    // Simple heuristic: assume models are initially facing forward (negative Z)
    // You might need to adjust this rotation per model
    model.rotation.y = 0 // Start facing camera
  }
  
  console.log(`📐 Model positioned: scale=${targetScale.toFixed(2)}, isHumanoid=${isHumanoid}`)
}

// Load NPC model and data with smooth transitions
function loadNPC(index) {
  if (isLoading) return

  isLoading = true
  updateModelStatus("Loading NPC...")

  const npc = npcDatabase[index]
  currentNPCIndex = index

  // Set camera position for this NPC
  setCameraForNPC(npc)

  // Start smooth transition
  const modelInfo = document.querySelector(".model-info")
  const canvas = document.getElementById("three-canvas")

  // Fade out current content
  modelInfo.classList.add("fade-transition")
  canvas.classList.add("fade-transition")
  setTimeout(() => {
    // Update UI with NPC info
    document.getElementById("npc-name").textContent = npc.name
    document.getElementById("npc-description").textContent = npc.description
    document.getElementById("chat-npc-name").textContent = npc.name
    document.getElementById("welcome-text").textContent = npc.startingPrompt

    // Update attributes
    const attributeElements = document.querySelectorAll('.attribute-tag')
    npc.attributes.forEach((attr, i) => {
      if (attributeElements[i]) {
        attributeElements[i].textContent = attr
      }
    })

    // Clear chat history
    clearChat()

    // Load 3D model
    loadModel(npc)

    // Fade in new content
    setTimeout(() => {
      modelInfo.classList.add("visible")
      canvas.classList.add("visible")
      isLoading = false
    }, 100)
  }, 300)
}

// Helper: set camera position for an NPC (x, y, z)
function setCameraForNPC(npc) {
  const cam = npc.camera || { x: 0, y: 1.6, z: 6.5 }
  if (camera) {
    camera.position.set(
      typeof cam.x === "number" ? cam.x : 0,
      typeof cam.y === "number" ? cam.y : 1.6,
      typeof cam.z === "number" ? cam.z : 6.5
    )
    if (controls) controls.update()
  }
}

// Allow changing camera position for the current NPC
function setNPCCamera({ x, y, z }) {
  const npc = npcDatabase[currentNPCIndex]
  if (!npc.camera) npc.camera = { x: 0, y: 1.6, z: 6.5 }
  if (typeof x === "number") npc.camera.x = x
  if (typeof y === "number") npc.camera.y = y
  if (typeof z === "number") npc.camera.z = z
  setCameraForNPC(npc)
}

// Load 3D model with smart positioning
function loadModel(npc) {
  // Remove current model
  if (currentModel) {
    scene.remove(currentModel)
    currentModel = null
  }

  if (!loader) {
    updateModelStatus("GLTFLoader not available")
    console.error("❌ GLTFLoader not available")
    return
  }

  updateModelStatus(`Loading ${npc.name}...`)
  console.log(`🔄 Attempting to load model: ${npc.modelPath}`)

  loader.load(
    npc.modelPath,
    (gltf) => {
      // Success - model loaded
      console.log(`✅ Successfully loaded model: ${npc.modelPath}`)
      updateModelStatus(`${npc.name} loaded successfully`)
      
      currentModel = gltf.scene

      // Apply smart positioning
      positionModelOptimally(currentModel)

      // Enable shadows and improve materials
      currentModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Improve material properties
          if (child.material) {
            child.material.needsUpdate = true
            // Enhance material for better character showcase
            if (child.material.map) {
              child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
            }
          }
        }
      })

      scene.add(currentModel)

      // Hide status after successful load
      setTimeout(() => {
        updateModelStatus("")
      }, 2000)
    },
    (progress) => {
      // Loading progress
      if (progress.total > 0) {
        const percent = (progress.loaded / progress.total) * 100
        updateModelStatus(`Loading ${npc.name}... ${percent.toFixed(0)}%`)
        console.log(`📊 Loading progress: ${percent.toFixed(1)}%`)
      }
    },
    (error) => {
      // Error loading model
      console.error(`❌ Failed to load model ${npc.modelPath}:`, error)
      updateModelStatus(`Failed to load ${npc.name} model`)
      
      // Show detailed error information
      console.log("🔍 Troubleshooting tips:")
      console.log("1. Check if the file exists at:", window.location.origin + "/" + npc.modelPath)
      console.log("2. Ensure the file is a valid GLB/GLTF format")
      console.log("3. Check browser console for CORS errors")
      console.log("4. Verify file permissions and server configuration")
    }
  )
}

// Event listeners
function initEventListeners() {
  // NPC navigation
  document.getElementById("prev-npc").addEventListener("click", () => {
    const newIndex = (currentNPCIndex - 1 + npcDatabase.length) % npcDatabase.length
    loadNPC(newIndex)
    updateNPCCounter()
  })

  document.getElementById("next-npc").addEventListener("click", () => {
    const newIndex = (currentNPCIndex + 1) % npcDatabase.length
    loadNPC(newIndex)
    updateNPCCounter()
  })

  // Chat functionality
  const chatInput = document.getElementById("chat-input")
  const sendBtn = document.getElementById("send-btn")
  const clearBtn = document.getElementById("clear-chat")

  sendBtn.addEventListener("click", sendMessage)
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  clearBtn.addEventListener("click", clearChat)
}

// Update the sendMessage function to handle async responses
async function sendMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, "user");
    input.value = "";
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message npc-message';
    typingDiv.innerHTML = '<div class="message-content">Processing through neural network...</div>';
    document.querySelector('.chat-content').appendChild(typingDiv);
    
    try {
        // Get AI response from backend
        const npcResponse = await generateNPCResponse(message);
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Add NPC response
        addMessage(npcResponse, "npc");
        
    } catch (error) {
        console.error('Error generating response:', error);
        typingDiv.remove();
        addMessage("My systems are temporarily offline. Please try again.", "npc");
    }
}

// Add message to chat with improved bubble sizing
function addMessage(content, sender) {
  const chatContent = document.querySelector(".chat-content")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${sender}-message`

  const messageContent = document.createElement("div")
  messageContent.className = "message-content"
  messageContent.innerHTML = `<p>${content}</p>`

  messageDiv.appendChild(messageContent)
  chatContent.appendChild(messageDiv)

  // Scroll to bottom smoothly
  chatContent.scrollTop = chatContent.scrollHeight

  // Add to history
  chatHistory.push({ content, sender, timestamp: Date.now() })
}

// Replace the entire generateNPCResponse function in script.js with this:
async function generateNPCResponse(userMessage) {
    try {
        const npc = npcDatabase[currentNPCIndex];
        
        // Make API call to your running backend
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                npcId: npc.name,
                messages: [
                    { role: "system", content: npc.startingPrompt },
                    { role: "user", content: userMessage }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.reply;
        
    } catch (error) {
        console.error('Error calling backend:', error);
        return "My neural pathways are experiencing interference. Please try again.";
    }
}



// Clear chat
function clearChat() {
  const chatContent = document.querySelector(".chat-content")
  const welcomeMessage = chatContent.querySelector(".welcome-message")
  chatContent.innerHTML = ""
  chatContent.appendChild(welcomeMessage)
  chatHistory = []
}

// Update NPC counter
function updateNPCCounter() {
  document.getElementById("current-npc").textContent = currentNPCIndex + 1
  document.getElementById("total-npcs").textContent = npcDatabase.length
}

// Utility function to add more NPCs dynamically
function addNPC(npcData) {
  npcDatabase.push(npcData)
  updateNPCCounter()
}

// Utility functions for user attributes
function updateUserAttribute(type, name, value) {
  if (type === "word") {
    const index = userAttributes.wordAttributes.indexOf(name)
    if (index === -1) {
      userAttributes.wordAttributes.push(name)
    }
  } else if (type === "progress") {
    const attr = userAttributes.progressAttributes.find(a => a.name === name)
    if (attr) {
      attr.value = Math.max(0, Math.min(100, value))
    } else {
      userAttributes.progressAttributes.push({ name, value: Math.max(0, Math.min(100, value)) })
    }
  }
  updatePerceptionDropdown()
}

function removeUserAttribute(type, name) {
  if (type === "word") {
    const index = userAttributes.wordAttributes.indexOf(name)
    if (index > -1) {
      userAttributes.wordAttributes.splice(index, 1)
    }
  } else if (type === "progress") {
    const index = userAttributes.progressAttributes.findIndex(a => a.name === name)
    if (index > -1) {
      userAttributes.progressAttributes.splice(index, 1)
    }
  }
  updatePerceptionDropdown()
}

// Export functions for potential external use
window.NPCChat = {
  addNPC,
  loadNPC,
  getCurrentNPC: () => npcDatabase[currentNPCIndex],
  getChatHistory: () => chatHistory,
  updateUserAttribute,
  removeUserAttribute,
  getUserAttributes: () => userAttributes,
  setNPCCamera // <--- Expose camera setter
}
