const test = require("ava");
const Sentiment = require("sentiment");
const { locale, languages } = require(".");
const sentiment = new Sentiment();

for (const lang of languages()) {
  test(`locale(${lang})`, (t) => {
    locale(lang);
    t.pass();
  });
}

test("invalid lang: aaa", (t) => {
  t.throws(() => locale("aaa"));
});

test("sentiment", (t) => {
  sentiment.registerLanguage("ro", locale("ro"));
  const result = sentiment.analyze(
    "Etanol răsturnat pe o șosea din județul Argeș, după un accident",
    { language: "ro" }
  );
  t.is(result.score < 0, true);
});
