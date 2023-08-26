const LANGUAGES = ["ro"];

function locale(lang) {
  if (!LANGUAGES.includes(lang)) throw new Error("Unsupported language");

  return {
    lables: require(`./${lang}/labels.json`),
    scoringStrategy: require(`./${lang}/scoring-strategy`)
  };
}

function languages() {
  return [...LANGUAGES];
}

module.exports = {
  locale,
  languages
};
