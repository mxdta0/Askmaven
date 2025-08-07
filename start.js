const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure your GitHub repository URL
const REPO_URL = 'https://github.com/mxdta0/Askmaven';
const BOT_DIRECTORY = 'bot-project';

const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution Error: ${error}`);
                reject(error);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve(stdout);
        });
    });
};

const deployBot = async () => {
    try {
        console.log('Starting deployment process...');

        // Check if the bot directory already exists. If so, remove it to ensure a clean clone.
        if (fs.existsSync(BOT_DIRECTORY)) {
            console.log(`Removing existing directory: ${BOT_DIRECTORY}`);
            await runCommand(`rm -rf ${BOT_DIRECTORY}`);
        }

        // Clone the repository
        console.log(`Cloning repository from ${REPO_URL}...`);
        await runCommand(`git clone ${REPO_URL} ${BOT_DIRECTORY}`);

        // Change into the new directory
        process.chdir(BOT_DIRECTORY);

        // Install npm packages
        console.log('Installing npm dependencies...');
        await runCommand('npm install');

        // Start the bot
        console.log('Starting the bot...');
        runCommand('node index.js');

        console.log('Deployment complete. Bot is running.');
    } catch (error) {
        console.error('Deployment failed:', error);
    }
};

deployBot();
