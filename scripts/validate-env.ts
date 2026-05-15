#!/usr/bin/env npx tsx
// ─────────────────────────────────────────────────────────────────────────────
// Environment Validation — runs pre-build to fail fast on missing config
// ─────────────────────────────────────────────────────────────────────────────

interface EnvCheck {
  key: string;
  required: boolean;
  validate?: (value: string) => boolean;
  hint: string;
}

const CHECKS: EnvCheck[] = [
  {
    key: 'VITE_API_URL',
    required: true,
    hint: 'Base URL for the MealDrama backend API. Example: https://api.mydomain.com/api/v1',
  },
  {
    key: 'NODE_ENV',
    required: false,
    validate: (v) => ['development', 'production', 'test'].includes(v),
    hint: 'Set to "development" for local dev, "production" for builds. Defaults to "development".',
  },
  {
    key: 'VITE_ENABLE_SMART_SUGGESTIONS',
    required: false,
    hint: 'Set "true" to enable AI-powered smart suggestions (requires backend GenAI endpoint).',
  },
  {
    key: 'VITE_ENABLE_MEAL_LOOP',
    required: false,
    hint: 'Set "true" to enable automated meal loop rotation (default: true).',
  },
];

interface ValidationResult {
  key: string;
  status: 'ok' | 'missing' | 'invalid' | 'warning';
  message: string;
}

function getEnvValue(key: string): string | undefined {
  // Vite exposes import.meta.env vars; Node reads process.env
  // In CI/build context, process.env is populated by the runner
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function validate(): void {
  const results: ValidationResult[] = [];
  let hasError = false;

  // Node version check
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0] || '0', 10);
  if (major < 20) {
    results.push({
      key: 'NODE_VERSION',
      status: 'missing',
      message: `Node.js >= 20 required (found ${nodeVersion}). Install via nvm: nvm install 20`,
    });
    hasError = true;
  }

  for (const check of CHECKS) {
    const value = getEnvValue(check.key);

    if (!value) {
      if (check.required) {
        results.push({
          key: check.key,
          status: 'missing',
          message: `Missing required env var: ${check.key}\n  ${check.hint}\n  Copy .env.example and fill in the value.`,
        });
        hasError = true;
      } else {
        results.push({
          key: check.key,
          status: 'warning',
          message: `Optional env var ${check.key} is not set.\n  ${check.hint}\n  Using default behavior.`,
        });
      }
      continue;
    }

    if (check.validate && !check.validate(value)) {
      results.push({
        key: check.key,
        status: 'invalid',
        message: `Invalid value for ${check.key}: "${value}".\n  ${check.hint}`,
      });
      hasError = true;
      continue;
    }

    results.push({
      key: check.key,
      status: 'ok',
      message: `${check.key}=${value ? '(set)' : '(not set)'}`,
    });
  }

  // Print results
  console.log('\n  ┌─ Environment Validation ──────────────────────────────┐');
  for (const r of results) {
    const icon = r.status === 'ok' ? ' ✓' : r.status === 'warning' ? ' ⚠' : ' ✗';
    const color = r.status === 'ok' ? '\x1b[32m' : r.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
    console.log(`  ${color}${icon}\x1b[0m  ${r.key.padEnd(36)} ${r.status}`);
  }
  console.log('  └────────────────────────────────────────────────────────┘\n');

  if (hasError) {
    console.error('\x1b[31m❌ Environment validation failed. Fix the errors above and re-run.\x1b[0m\n');
    process.exit(1);
  }

  console.log('\x1b[32m✅ Environment validation passed.\x1b[0m\n');
}

validate();
