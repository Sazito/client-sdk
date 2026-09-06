import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const external = [
  '@sazito/client-sdk',
  'react',
  'react-dom',
  'react/jsx-runtime'
];

const input = {
  'core/index': 'src/core/index.ts',
  'react/index': 'src/react/index.ts',
  'next/index': 'src/next/index.ts',
  'next/payment-return': 'src/next/payment-return.ts',
  'next/server': 'src/next/server.ts',
  'server/index': 'src/server/index.ts'
};

const clientBanner = (chunk) =>
  chunk.name === 'react/index' || chunk.name === 'next/index'
    ? "'use client';"
    : '';

const onwarn = (warning, warn) => {
  if (
    warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
    warning.code === 'UNUSED_EXTERNAL_IMPORT'
  ) return;
  warn(warning);
};

const javascript = {
  input,
  external,
  output: [
    {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      banner: clientBanner,
      sourcemap: true
    },
    {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: 'chunks/[name]-[hash].cjs',
      banner: clientBanner,
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve({ extensions: ['.ts', '.tsx'] }),
    typescript({ tsconfig: './tsconfig.build.json' })
  ],
  onwarn
};

const declarations = Object.entries(input).map(([name, source]) => ({
  input: source,
  external,
  output: [
    { file: `dist/${name}.d.ts`, format: 'es' },
    { file: `dist/${name}.d.cts`, format: 'es' }
  ],
  plugins: [dts({ tsconfig: './tsconfig.build.json' })],
  onwarn
}));

export default [javascript, ...declarations];
