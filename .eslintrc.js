module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    '@react-native-community',
    'airbnb'
  ],
  plugins: [
    'jsx-a11y',
    'import',
    '@typescript-eslint'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json'
  },
  globals: {
    Reactotron: true,
  },
  rules: {
    'curly': ['error', 'all'],
    'valid-jsdoc': 'error',
    'linebreak-style': 'off',
    'no-console': 'off',
    'object-curly-newline': 'off',
    'no-unused-expressions': 'off',
    'no-unused-vars': 'off',
    'prefer-destructuring': ['error', {
      VariableDeclarator: {
        object: true,
      },
    }],
    'function-paren-newline': ['error', 'consistent'],
    'lines-between-class-members': ['error', 'always', { 'exceptAfterSingleLine': true }],
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxBOF': 0, 'maxEOF': 0 }],
  
    'eslint-comments/no-unlimited-disable': 'off',
  
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
  
    'react/jsx-filename-extension': 'off',
    'react/no-unused-prop-types': 'off',
    'react/sort-comp': 'off',
    'react/no-array-index-key': 'off',
    'react/require-default-props': 'off',
    'react/no-unused-state': 'off',
    'react/prop-types': 'off',
  
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        parser: 'flow',
        trailingComma: 'all',
        printWidth: 100
      },
      '@format'
    ],

    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/explicit-function-return-type': ['off', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
  },
};
