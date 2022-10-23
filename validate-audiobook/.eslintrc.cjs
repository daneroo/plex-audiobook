module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  // just until eslint supports top-level await
  // as well as
  // npm install --save-dev @babel/eslint-parser @babel/core @babel/plugin-syntax-top-level-await
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: {
    // TODO remove this...
    // just cause this code is transient
    'no-constant-condition': 'off',
  },
}
