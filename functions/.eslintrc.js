module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "sourceType": "module",
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "valid-jsdoc": ["error", {
      "requireParamDescription": true,
      "requireReturnDescription": true,
    }],
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "max-len": ["error", {code: 150, tabWidth: 2, ignoreComments: true, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true}],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
