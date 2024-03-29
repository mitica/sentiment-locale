const LANGUAGES = ["ro", "es", "it", "bg", "cs", "hu"];

function locale(lang) {
  if (!LANGUAGES.includes(lang)) throw new Error("Unsupported language");

  return {
    labels: require(`./${lang}/labels.json`),
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
