/**
 * The languages a coding problem can allow.
 *
 * These are CANONICAL keys, deliberately decoupled from any one judge: the
 * database and the UI speak these keys, and only the server-side judge adapter
 * (src/lib/judge.ts) maps them to a specific engine's language ids. Swap Judge0
 * for Piston later and nothing here changes.
 *
 * `monaco` is the Monaco editor's language id, for syntax highlighting.
 */
export interface CodingLanguage {
  key: string;
  label: string;
  monaco: string;
}

export const CODING_LANGUAGES: CodingLanguage[] = [
  { key: 'python', label: 'Python 3', monaco: 'python' },
  { key: 'cpp', label: 'C++', monaco: 'cpp' },
  { key: 'c', label: 'C', monaco: 'c' },
  { key: 'java', label: 'Java', monaco: 'java' },
  { key: 'javascript', label: 'JavaScript (Node)', monaco: 'javascript' },
];

const BY_KEY = new Map(CODING_LANGUAGES.map((l) => [l.key, l]));

export function isLanguageKey(value: unknown): value is string {
  return typeof value === 'string' && BY_KEY.has(value);
}

export function languageLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? key;
}

export function monacoLanguage(key: string): string {
  return BY_KEY.get(key)?.monaco ?? 'plaintext';
}

/** A tiny starter stub so the editor is never blank. */
export function starterCode(key: string): string {
  switch (key) {
    case 'python':
      return '# Read input with input(); print your answer.\n';
    case 'cpp':
      return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n';
    case 'c':
      return '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n';
    case 'java':
      return 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n';
    case 'javascript':
      return '// Read from stdin, write to stdout.\n';
    default:
      return '';
  }
}
