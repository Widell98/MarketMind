import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const supabaseStubPath = path.join(projectRoot, 'scripts', 'supabase-test-client.mjs');

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const resolveAliasPath = async (specifier) => {
  if (!specifier.startsWith('@/')) {
    return null;
  }

  const relativePath = specifier.slice(2);
  const basePath = path.join(srcDir, relativePath);
  const candidates = [basePath, ...extensions.map((ext) => `${basePath}${ext}`), ...extensions.map((ext) => path.join(basePath, `index${ext}`))];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  return null;
};

const resolveRelativeSpecifier = async (specifier, parentURL) => {
  if (!parentURL || !parentURL.startsWith('file://')) {
    return null;
  }

  const parentPath = path.dirname(fileURLToPath(parentURL));
  const basePath = path.join(parentPath, specifier);
  const candidates = [
    basePath,
    ...extensions.map((ext) => `${basePath}${ext}`),
    ...extensions.map((ext) => path.join(basePath, `index${ext}`)),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  return null;
};

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === '@/integrations/supabase/client') {
    return { url: pathToFileURL(supabaseStubPath).href, shortCircuit: true };
  }

  const aliasResolution = await resolveAliasPath(specifier);
  if (aliasResolution) {
    return { url: aliasResolution, shortCircuit: true };
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const relative = await resolveRelativeSpecifier(specifier, context.parentURL);
    if (relative) {
      return { url: relative, shortCircuit: true };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (!url.startsWith('file://')) {
    return defaultLoad(url, context, defaultLoad);
  }

  const filename = fileURLToPath(url);
  if (!/\.(tsx?|jsx?)$/i.test(filename)) {
    return defaultLoad(url, context, defaultLoad);
  }

  const source = await readFile(filename, 'utf8');
  const loader = filename.endsWith('.tsx') ? 'tsx' : filename.endsWith('.ts') ? 'ts' : filename.endsWith('.jsx') ? 'jsx' : 'js';
  const { code } = await esbuild.transform(source, {
    loader,
    target: 'es2020',
    format: 'esm',
    sourcemap: 'inline',
  });

  return { format: 'module', source: code, shortCircuit: true };
}
