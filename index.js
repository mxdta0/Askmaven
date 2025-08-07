// Load environment variables from .env file
require('dotenv').config();

// Import necessary libraries
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Get the tokens from your environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHATSUTRA_API_KEY = process.env.CHATSUTRA_API_KEY;

// Check if tokens are available
if (!TELEGRAM_BOT_TOKEN || !CHATSUTRA_API_KEY) {
  console.error("Error: TELEGRAM_BOT_TOKEN and CHATSUTRA_API_KEY must be set in the environment.");
  process.exit(1);
}

// Create a new Telegram bot instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Listen for any incoming message
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Ignore messages from bots or empty messages
    if (msg.from.is_bot || !userMessage) {
        return;
    }

    // Send a "typing" action to let the user know the bot is working
    bot.sendChatAction(chatId, 'typing');

    try {
        // Prepare the request to the Chatsutra AI API
        const response = await axios.post('https://api.two.ai/v2/chat/completions', {
            model: "sutra-v2",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: userMessage }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${CHATSUTRA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Extract the AI's response text
        const aiResponse = response.data.choices[0].message.content;

        // Send the AI's response back to the Telegram chat
        bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        // Inform the user if something went wrong
        bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
    }
});

console.log('Bot is running...');
