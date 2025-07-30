import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    markdown: false,
  },
  {
    files: ['./packages/gramok/src/td/**/*.ts'],
    rules: {
      'new-cap': 'off',
    },
  },
)
