const { Module } = require('../main');
const config = require('../config');
const axios = require('axios');

// Helper function to get AI response
async function getAIResponse(query) {
    const API_KEY = config.OPENROUTER_API_KEY;
    if (!API_KEY) throw new Error('API key not configured');
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'sonoma-dusk-alpha',
        messages: [{ role: 'user', content: query }]
    }, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data.choices[0].message.content;
}

// Manual command module
Module({
    pattern: 'think ?(.*)',
    fromMe: false,
    desc: 'AI chatbot using OpenRouter API',
    type: 'ai',
    usage: 'think [your question]'
}, async (message, match) => {
    // Check if auto-reply mode is enabled
    if (config.AI_AUTO_REPLY === 'true') {
        return message.sendReply('_AI is in auto-reply mode. No need to use the think command._');
    }
    
    const userQuery = match[1];
    if (!userQuery) return message.sendReply('_Please provide a question for the AI_');
    
    try {
        const aiResponse = await getAIResponse(userQuery);
        await message.sendReply(aiResponse);
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        await message.sendReply('_AI service unavailable. Please try again later._');
    }
});

// Auto-reply module
Module({
    on: 'text',
    fromMe: false,
    desc: 'Auto-reply to messages with AI',
    type: 'ai'
}, async (message) => {
    // Check if auto-reply mode is enabled
    if (config.AI_AUTO_REPLY !== 'true') return;
    
    // Skip if message is a command (starts with '.')
    if (message.message.startsWith('.')) return;
    
    // Skip if message is from the bot itself
    if (message.sender === message.client.user.id) return;
    
    // Skip if in group and group auto-reply is disabled
    if (message.isGroup && config.AI_AUTO_REPLY_GROUPS !== 'true') return;
    
    try {
        const aiResponse = await getAIResponse(message.message);
        await message.sendReply(aiResponse);
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        // Don't send error message in auto-reply mode to avoid spam
    }
});
