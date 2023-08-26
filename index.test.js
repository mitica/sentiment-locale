const test = require("ava");
const { locale, languages } = require(".");

for (const lang of languages()) {
  test(`locale(${lang})`, (t) => {
    locale(lang);
    t.pass();
  });
}

test("invalid lang: aaa", (t) => {
  t.throws(() => locale("aaa"));
});
