const negators = require("./negators.json");

module.exports = {
  apply: function (tokens, cursor, tokenScore) {
    if (cursor > 0) {
      const prevtoken = tokens[cursor - 1];
      if (negators[prevtoken]) {
        tokenScore = -tokenScore;
      }
    }
    return tokenScore;
  }
};
