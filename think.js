const { Module } = require('../main');
const config = require('../config');
const axios = require('axios');

// Helper function to get AI response
async function getAIResponse(query) {
    const API_KEY = config.OPENROUTER_API_KEY;
    if (!API_KEY) throw new Error('API key not configured');
    
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openrouter/sonoma-dusk-alpha',
            messages: [{ role: 'user', content: query }]
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://raganork-md.com',
                'X-Title': 'Raganork-MD Bot'
            },
            timeout: 30000
        });
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        throw error;
    }
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
        // Check API key first
        if (!config.OPENROUTER_API_KEY) {
            return message.sendReply('_OpenRouter API key not configured! Set it using `.setvar OPENROUTER_API_KEY=your_key`_');
        }
        
        const aiResponse = await getAIResponse(userQuery);
        await message.sendReply(aiResponse);
    } catch (error) {
        console.error('Think Command Error:', error.response?.data || error.message);
        
        // Send detailed error to owner
        if (message.fromOwner) {
            const errorDetails = error.response?.data?.error?.message || error.message;
            await message.sendReply(`_Error: ${errorDetails}_`);
        } else {
            await message.sendReply('_AI service unavailable. Please try again later._');
        }
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
        console.error('Auto-reply Error:', error.response?.data || error.message);
        // Don't send error message in auto-reply mode to avoid spam
    }
});

// Debug command for owner
Module({
    pattern: 'aistatus',
    fromMe: true,
    desc: 'Check AI service status',
    type: 'owner'
}, async (message) => {
    try {
        if (!config.OPENROUTER_API_KEY) {
            return message.sendReply('_API key not configured_');
        }
        
        // Test API connectivity
        await message.sendReply('_Testing API connection..._');
        const testResponse = await getAIResponse('Say "test" if you can hear me');
        await message.sendReply(`✅ AI service is working\n\nResponse: ${testResponse}`);
    } catch (error) {
        const errorDetails = error.response?.data?.error?.message || error.message;
        await message.sendReply(`❌ AI service error: ${errorDetails}`);
    }
});

// Configuration check command
Module({
    pattern: 'aicheck',
    fromMe: true,
    desc: 'Check AI configuration',
    type: 'owner'
}, async (message) => {
    const checks = [
        { name: 'API Key', value: config.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set' },
        { name: 'Auto-Reply', value: config.AI_AUTO_REPLY === 'true' ? '✅ Enabled' : '❌ Disabled' },
        { name: 'Group Auto-Reply', value: config.AI_AUTO_REPLY_GROUPS === 'true' ? '✅ Enabled' : '❌ Disabled' },
        { name: 'Model', value: 'openrouter/sonoma-dusk-alpha' }
    ];
    
    const status = checks.map(c => `${c.name}: ${c.value}`).join('\n');
    await message.sendReply(`🔍 AI Configuration:\n\n${status}`);
});
