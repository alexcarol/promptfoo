import * as path from 'path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAssertion } from '../../src/assertions/index';
import { OpenAiChatCompletionProvider } from '../../src/providers/openai/chat';
import * as rubyUtils from '../../src/ruby/rubyUtils';
import { runRubyCode } from '../../src/ruby/wrapper';

import type { Assertion, AtomicTestCase, GradingResult } from '../../src/types/index';

vi.mock('../../src/ruby/wrapper', async () => {
  const actual =
    await vi.importActual<typeof import('../../src/ruby/wrapper')>('../../src/ruby/wrapper');
  return {
    ...actual,
    runRubyCode: vi.fn(actual.runRubyCode),
  };
});

vi.mock('../../src/ruby/rubyUtils', async () => {
  const actual = await vi.importActual<typeof import('../../src/ruby/rubyUtils')>(
    '../../src/ruby/rubyUtils',
  );
  return {
    ...actual,
    runRuby: vi.fn(actual.runRuby),
  };
});

vi.mock('path', async () => {
  const actualPath = await vi.importActual<typeof import('path')>('path');
  const mocked = {
    ...actualPath,
    resolve: vi.fn(),
    extname: vi.fn(),
  };
  return {
    ...mocked,
    default: mocked,
  };
});

vi.mock('../../src/redteam/remoteGeneration', () => ({
  shouldGenerateRemote: vi.fn().mockReturnValue(false),
}));

vi.mock('proxy-agent', () => ({
  ProxyAgent: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('node:module', () => {
  const mockRequire: NodeJS.Require = {
    resolve: vi.fn() as unknown as NodeJS.RequireResolve,
  } as unknown as NodeJS.Require;
  return {
    createRequire: vi.fn().mockReturnValue(mockRequire),
  };
});

vi.mock('glob', () => ({
  globSync: vi.fn(),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  getDb: vi.fn(),
}));

vi.mock('../../src/cliState', () => ({
  default: {
    basePath: '/base/path',
  },
  basePath: '/base/path',
}));

describe('not-ruby inverse assertions', () => {
  const baseParams = {
    prompt: 'test',
    provider: new OpenAiChatCompletionProvider('gpt-4o-mini'),
    test: {} as AtomicTestCase,
    providerResponse: { output: 'test output' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runRubyCode).mockReset();
    vi.mocked(rubyUtils.runRuby).mockReset();
  });

  it('should invert boolean true to fail for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce(true);

    const assertion: Assertion = {
      type: 'not-ruby',
      value: 'true',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toContain('Ruby code returned true');
  });

  it('should invert boolean false to pass for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce(false);

    const assertion: Assertion = {
      type: 'not-ruby',
      value: 'false',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    expect(result.pass).toBe(true);
    expect(result.reason).toBe('Assertion passed');
  });

  it('should invert numeric score for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce(0.8);

    const assertion: Assertion = {
      type: 'not-ruby',
      value: '0.8',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    // A positive score should fail when inverted
    expect(result.pass).toBe(false);
    expect(result.score).toBeCloseTo(0.2); // inverted: 1 - 0.8
  });

  it('should invert zero numeric score to pass for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce(0);

    const assertion: Assertion = {
      type: 'not-ruby',
      value: '0',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    // A zero score should pass when inverted
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1); // inverted: 1 - 0
  });

  it('should invert GradingResult for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce({
      pass: true,
      score: 0.9,
      reason: 'original reason',
    });

    const assertion: Assertion = {
      type: 'not-ruby',
      value: '{"pass": true, "score": 0.9, "reason": "original reason"}',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    // A passing result should fail when inverted
    expect(result.pass).toBe(false);
    expect(result.score).toBeCloseTo(0.1); // inverted: 1 - 0.9
  });

  it('should invert failing GradingResult to pass for not-ruby', async () => {
    vi.mocked(runRubyCode).mockResolvedValueOnce({
      pass: false,
      score: 0.2,
      reason: 'original reason',
    });

    const assertion: Assertion = {
      type: 'not-ruby',
      value: '{"pass": false, "score": 0.2, "reason": "original reason"}',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    // A failing result should pass when inverted
    expect(result.pass).toBe(true);
    expect(result.score).toBe(0.8); // inverted: 1 - 0.2
  });

  it('should handle not-ruby with file:// reference', async () => {
    vi.mocked(path.resolve).mockReturnValue('/path/to/assert.rb');
    vi.mocked(path.extname).mockReturnValue('.rb');
    vi.mocked(rubyUtils.runRuby).mockResolvedValueOnce(true);

    const assertion: Assertion = {
      type: 'not-ruby',
      value: 'file:///path/to/assert.rb',
    };

    const result: GradingResult = await runAssertion({
      ...baseParams,
      assertion,
    });

    // File returning true should fail when inverted
    expect(result.pass).toBe(false);
  });
});
