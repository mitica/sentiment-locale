# sentiment-locale

Languages for [sentiment](https://www.npmjs.com/package/sentiment).

Supported languages: `ro`, `es`.

## Usage

```js
const Sentiment = require("sentiment");
const { locale, languages } = require("sentiment-locale");

const sentiment = new Sentiment();

sentiment.registerLanguage("ro", locale("ro"));
const result = sentiment.analyze(
  "Etanol răsturnat pe o șosea din județul Argeș, după un accident",
  { language: "ro" }
);
```

## Adding new languages

### 1. Generate new languages using ChatGPT (or do it manually)

Required envs: `OPENAI_API_KEY`, `OPENAI_ORG_ID`. Use `.env` file or add them in command line.

Generate 100 words (per sentiment) for the French language:

```sh
yarn generate --limit 100 fr
```

### 2. Updated supported languages

Update const `LANGUAGES` in `index.js` with the new language.
