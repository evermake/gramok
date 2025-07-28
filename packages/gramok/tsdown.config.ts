import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: './dist',
  clean: true,
  tsconfig: './tsconfig.json',
  unbundle: true,
  dts: true,
  platform: 'node',
})
