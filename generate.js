const minimist = require("minimist");
const { OpenAI } = require("openai");
const fs = require("fs/promises");
const { join } = require("path");

require("dotenv").config();

const organization = process.env.OPENAI_ORG_ID;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) throw new Error("Missing OPENAI_API_KEY environment variables");
const options = minimist(process.argv.slice(2));
const lang = options.lang || options._[0] || "";
const limit = options.limit || 100;

console.log("options:", options);

if (!/[a-z]{2}/.test(lang)) throw new Error("Invalid language code");
if (typeof limit !== "number") throw new Error("Invalid limit");

const openai = new OpenAI({ apiKey, organization });

const SIZE = 100;

const getList = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k", //"gpt-4-0613", //"gpt-3.5-turbo-0613",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 10_000,
    n: 1
    // stop: STOP
  });

  let json;
  let text = response.choices[0].message?.content || "";
  const startIndex = text.indexOf("```json");
  const endIndex = text.lastIndexOf("```");
  if (startIndex > 0 && endIndex > startIndex)
    text = text.substring(startIndex + 7, endIndex);

  try {
    json = JSON.parse(text);
  } catch (e) {
    console.log("Error parsing json");
    console.log(text);
    throw e;
  }

  return json;
};

async function generatePrompt(sentiment, response) {
  const prompt = `List top ${SIZE} common ${sentiment} words in ${lang} language, similar to AFINN-165, as much as you can.
Your output is only in JSON format: {"word": score, ...}.${
    response ? `
Avoid ${Object.keys(response).slice(0, 50).join(",")}.` : ""
  }`;

  return prompt;
}

const generateList = async (sentiment) => {
  const pages = Math.ceil(limit / SIZE) + 1;
  let list = {};
  for (let i = 0; i < pages; i++) {
    console.log(`Generating ${sentiment} list ${i + 1}/${pages}`);
    const prompt = await generatePrompt(sentiment, i === 0 ? null : list);
    const response = await getList(prompt);
    list = { ...response, ...list };
    if (Object.keys(list).length >= limit) break;
    await new Promise((resolve) => setTimeout(resolve, 1000 * 1));
  }

  console.log(
    `Generated ${sentiment} list with ${Object.keys(list).length} words`
  );

  return list;
};

const exists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
};

async function generate() {
  const positive = await generateList("positive");
  const negative = await generateList("negative");

  let list = { ...positive, ...negative };
  const dir = join(__dirname, lang);
  if (!(await exists(dir))) await fs.mkdir(dir);
  const file = join(dir, "labels.json");
  if (await exists(file)) {
    const existing = require(`./${lang}/labels.json`);
    list = { ...existing, ...list };
  }
  await fs.writeFile(file, JSON.stringify(list, null, 2));
}

generate().then(() => console.log("Done"), console.error);
