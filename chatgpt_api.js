const https = require('https');
const fs = require('fs');
const readline = require('readline');
const modifyOrCreateError = `Invalid input. Please type "modify" or "create".`;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
console.log(process.argv)
if(process.argv.length === 2) {
 startingPrompt();
} else if (process.argv.length === 3) {
  modifyOrCreatePrompt(process.argv[2])
} else if (process.argv.length === 4) {
  console.log(process.argv[2])
  if (process.argv[2] === 'modify') {
    adjustmentPrompt(process.argv[3])
  } else if (process.argv[2] === 'create') {
    create(process.argv[3])
  } else {
    console.error(modifyOrCreateError);
    process.exit(1);
  }
}
function startingPrompt() {
  rl.question('Would you like to modify or create a file? (Type "modify" or "create"): ', modifyOrCreatePrompt);
}
function modifyOrCreatePrompt(command) {
  if (command === 'modify') {
    modifyPrompt()
  } else if (command === 'create') {
    createPrompt()
  } else {
    console.error(modifyOrCreateError);
    process.exit(1);
  }
}

function modifyPrompt() {
  rl.question('File name: ', adjustmentPrompt);
}
function adjustmentPrompt(fileName) {
  rl.question('adjustment: ', async (inputString) => {
    return modify(fileName, inputString);
  });
}
function createPrompt() {
  rl.question('File name: ', create);
}

async function modify(fileName, inputString) {
  const previousContents = fs.readFileSync(fileName, 'utf-8');
  const backupFile = `${fileName}-backup-${Date.now()}.js`;
  try {
    fs.writeFileSync(backupFile, previousContents);
    const response = await sendTextToChatGPT(`\nrewrite this file to ${inputString}\n\n${previousContents}`);
    fs.writeFileSync(fileName, response);
    console.log(`Done.`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}
async function create(fileName) {
  const response = await sendTextToChatGPT(`\nreturn the code that would go in a file named: ${fileName}\n`);
  fs.writeFileSync(fileName, response);
  console.log(`Done.`);
  process.exit();
}

function sendTextToChatGPT(prompt) {
  console.log("sending_request...");
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`};
    const requestBody = {
      model: "gpt-3.5-turbo",
      messages: [{"role": "system", "content": "Only respond in code blocks. Do not explain or clarify anything. Write all code in javascript. Prefer the standard library over npm packages."},
      {"role": "user", "content": prompt}],
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
          const lines = parsedData.choices[0].message.content.trim().split('\n');
          const filteredLines = lines.filter(line => !line.includes('\`\`\`'));
          response = filteredLines.join('\n');
          resolve(response);
        } else {reject(`Error: ${res.statusCode}`);}
      });
    });
    req.on('error', (error) => {reject(error);});
    req.write(JSON.stringify(requestBody));
    req.end();
  })
}