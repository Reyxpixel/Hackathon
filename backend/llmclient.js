const axios = require('axios');
const crypto = require('crypto');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqApiCall(messages, model = 'llama-3.3-70b-versatile') {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      { model, messages },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error('AI service unavailable');
  }
}

async function classifyInput(message) {
  const systemPrompt = `You are ${context.permanentTraits.name}.
  Description: ${context.permanentTraits.description}
  Personality: ${context.permanentTraits.personality}
  Attributes: ${context.permanentTraits.attributes.join(', ')}
  Model Path: ${context.permanentTraits.modelPath}
  Starting Prompt: ${context.permanentTraits.startingPrompt}
  
  Respond in character, using your unique voice and knowledge.`;

  
  try {
    const result = await groqApiCall([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);
    
    const classification = JSON.parse(result);
    
    // Validate structure
    if (!classification.permanentTraits || !classification.temporaryTraits) {
      throw new Error('Invalid classification structure');
    }
    
    // Generate hash for blockchain storage
    classification.hash = crypto.createHash('sha256')
      .update(JSON.stringify(classification.permanentTraits))
      .digest('hex');
      
    return classification;
  } catch (error) {
    console.error('Classification Error:', error.message);
    return { 
      permanentTraits: [],
      temporaryTraits: ['Neutral:50', 'General:casual'],
      responseType: 'Casual',
      hash: ''
    };
  }
}

async function chatCompletion(messages, context) {
  const systemPrompt = `You are an AI NPC with the following characteristics:

PERMANENT TRAITS:
- Core Personality: ${context.permanentTraits.corePersonality}
- Learning Style: ${context.permanentTraits.learningStyle}
- Adaptability: ${context.permanentTraits.adaptability}/100
- Moral Alignment: ${context.permanentTraits.moralAlignment}
- Experience Level: ${context.permanentTraits.experienceLevel}

CURRENT STATE:
- Mood: ${context.temporaryTraits.currentMood}
- Focus: ${context.temporaryTraits.conversationFocus}
- Session Context: ${context.temporaryTraits.sessionContext} messages

Respond naturally according to these traits. Show growth and learning from interactions.`;
  
  try {
    return await groqApiCall([
      { role: "system", content: systemPrompt },
      ...messages
    ]);
  } catch (error) {
    console.error('Chat completion error:', error);
    return "I'm having trouble processing that right now. Please try again.";
  }
}

module.exports = { chatCompletion, classifyInput };
