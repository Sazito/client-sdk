// Publishing build (optional). For local development the example app consumes
// the TypeScript source directly via Next's `transpilePackages`, so this config
// is only needed to produce a distributable `dist/` for npm.
//
// To enable: install the rollup plugins below, then point package.json `exports`
// at the built files instead of `src`.
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';

const external = [
  '@sazito/client-sdk',
  'react',
  'react-dom',
  'react/jsx-runtime'
];

const entries = {
  core: 'src/core/index.ts',
  react: 'src/react/index.tsx',
  next: 'src/next/index.tsx'
};

export default Object.entries(entries).map(([name, input]) => ({
  input,
  external,
  output: [
    { file: `dist/${name}.js`, format: 'esm', sourcemap: true }
  ],
  plugins: [
    nodeResolve({ extensions: ['.ts', '.tsx'] }),
    postcss({ extract: 'styles.css' }),
    typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist/types', noEmit: false })
  ]
}));
