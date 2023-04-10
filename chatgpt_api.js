/**
 * By Jackson Stone
 */

const https = require('https');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('adjustment: ', async (inputString) => {
  const previousContents = fs.readFileSync("chatgpt_api.js", 'utf-8');
  const backupFile = `${Date.now()}-backup.js`;

  try {
    fs.writeFileSync(backupFile, previousContents);
    let response = await sendTextToChatGPT(`\nrewrite this file to ${inputString}\n\n${previousContents}`);
    const lines = response.split('\n');
    const filteredLines = lines.filter(line => !line.includes('\`\`\`'));
    response = filteredLines.join('\n');
    fs.writeFileSync("chatgpt_api.js", response);
    console.log(`Done.`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
});

function sendTextToChatGPT(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`};
    const requestBody = {
      model: "davinci",
      prompt: `Only respond in code blocks. Do not explain or clarify anything. Write all code in javascript. Prefer the standard library over npm packages.\n${prompt}`,
      temperature: 0
    };
    const options = {method: 'POST', headers};
    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {data += chunk;});
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsedData = JSON.parse(data);
          console.log(parsedData);
          resolve(parsedData.choices[0].text.trim());
        } else {reject(`Error: ${res.statusCode}`);}
      });
    });
    req.on('error', (error) => {reject(error);});
    req.write(JSON.stringify(requestBody));
    req.end();
  })
}