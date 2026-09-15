/*
 * eslint-config-next ships flat config in v16, so it is spread directly —
 * routing it through FlatCompat (the v15 shape) throws on a circular
 * structure before a single file is linted.
 */
import next from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...(Array.isArray(next) ? next : [next]),
  ...(Array.isArray(nextTypescript) ? nextTypescript : [nextTypescript]),
  { ignores: ['.next/**', 'node_modules/**'] },
];

export default config;
