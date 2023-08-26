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

const getList = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k", //"gpt-4-0613", //"gpt-3.5-turbo-0613",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 14_000,
    n: 1
    // stop: STOP
  });

  let json;
  let text = response.choices[0].message?.content || "";
  let startIndex = text.indexOf("```json");
  startIndex = startIndex > 0 ? startIndex : text.indexOf("```");
  startIndex = startIndex > 0 ? startIndex : text.indexOf("{");
  let endIndex = text.lastIndexOf("```");
  endIndex = endIndex > 0 ? endIndex : text.lastIndexOf("}");
  if (startIndex > 0 && endIndex > startIndex) {
    text = text.substring(startIndex, endIndex).trim();
    text = text.substring(text.indexOf("{")).trim();
  }

  try {
    json = JSON.parse(text);
  } catch (e) {
    console.log("Error parsing json");
    console.log(text);
    throw e;
  }
  const keys = Object.keys(json);
  if (keys.length && typeof json[keys[0]] !== "number") {
    for (const key of keys) {
      json[key] = parseInt(json[key], 10);
    }
  }

  return json;
};

async function generatePrompt(sentiment, size, response) {
  const prompt = `List top ${size} common ${sentiment} words in ${lang} language. Use same score format as AFINN-165 (-5 to +5), avoid neutral words.
As much as you are able. Output as JSON format: {"word": score, ...}.${
    response
      ? `
Omit: ${Object.keys(response).slice(0, size).join(",")}.`
      : ""
  }`;

  return prompt;
}

const generateList = async (sentiment, limit) => {
  const pages = Math.ceil(limit / 50) + 1;
  let list = {};
  for (let i = 0; i < pages; i++) {
    console.log(`Generating ${sentiment} list ${i + 1}/${pages}`);
    const prompt = await generatePrompt(sentiment, 50, i === 0 ? null : list);
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

const writeList = async (list) => {
  const dir = join(__dirname, lang);
  if (!(await exists(dir))) await fs.mkdir(dir);
  const file = join(dir, "labels.json");
  if (await exists(file)) {
    const existing = require(`./${lang}/labels.json`);
    list = { ...existing, ...list };
  }
  list = Object.keys(list)
    .sort()
    .reduce((obj, key) => {
      obj[key] = list[key];
      return obj;
    }, {});
  await fs.writeFile(file, JSON.stringify(list, null, 2));
};

async function generate() {
  let positive = await generateList("positive verbs", limit / 2);
  await writeList(positive);
  positive = await generateList("positive adjectives", limit / 2);
  await writeList(positive);
  positive = await generateList("positive", limit);
  await writeList(positive);
  let negative = await generateList("negative verbs", limit / 2);
  await writeList(negative);
  negative = await generateList("negative adjectives", limit / 2);
  await writeList(negative);
  negative = await generateList("negative", limit);
  await writeList(negative);
}

generate().then(() => console.log("Done"), console.error);
