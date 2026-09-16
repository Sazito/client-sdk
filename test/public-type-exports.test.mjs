import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

test('every exported SDK API and model type is available from the package root', () => {
  const project = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  assert.equal(project.error, undefined);
  const config = ts.parseJsonConfigFileContent(project.config, ts.sys, process.cwd());
  const program = ts.createProgram(config.fileNames, config.options);
  const checker = program.getTypeChecker();
  const root = program.getSourceFile(path.resolve('src/index.ts'));
  assert.ok(root);

  const resolve = (symbol) => symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
  const exportsOf = (file) => checker.getExportsOfModule(checker.getSymbolAtLocation(file));
  const publicTypes = new Set(exportsOf(root).map(resolve));
  const files = [
    ...['src/api', 'src/types'].flatMap((directory) =>
      readdirSync(directory)
        .filter((name) => name.endsWith('.ts'))
        .map((name) => path.resolve(directory, name))
    ),
    ...[
      'src/core/config.ts',
      'src/core/client.ts',
      'src/core/http-client.ts',
      'src/core/module-context.ts',
      'src/utils/credentials-manager.ts'
    ].map((name) => path.resolve(name))
  ];

  const missing = [];
  for (const filename of files) {
    const file = program.getSourceFile(filename);
    assert.ok(file, filename);
    for (const symbol of exportsOf(file)) {
      const target = resolve(symbol);
      if ((target.flags & ts.SymbolFlags.Type) && !publicTypes.has(target)) {
        missing.push(`${path.relative(process.cwd(), filename)}: ${symbol.name}`);
      }
    }
  }

  assert.deepEqual(missing, []);

  const docs = readFileSync('docs/content/docs/api-reference/types.mdx', 'utf8');
  const publicNames = exportsOf(root)
    .filter((symbol) => resolve(symbol).flags & ts.SymbolFlags.Type)
    .map((symbol) => symbol.name);
  const undocumented = publicNames.filter((name) => !docs.includes(`\`${name}\``));
  assert.deepEqual(undocumented, []);

  for (const declaration of ['dist/index.d.ts', 'dist/index.d.mts']) {
    const filename = path.resolve(declaration);
    const packageProgram = ts.createProgram([filename], {
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      noEmit: true
    });
    const packageChecker = packageProgram.getTypeChecker();
    const packageFile = packageProgram.getSourceFile(filename);
    assert.ok(packageFile, declaration);
    const packageExports = new Set(packageChecker
      .getExportsOfModule(packageChecker.getSymbolAtLocation(packageFile))
      .map((symbol) => symbol.name));
    assert.deepEqual(publicNames.filter((name) => !packageExports.has(name)), [], declaration);
  }
});
