"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportProviderAPIKeyWarnings = reportProviderAPIKeyWarnings;
exports.createDummyFiles = createDummyFiles;
exports.initializeProject = initializeProject;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const confirm_1 = __importDefault(require("@inquirer/confirm"));
const core_1 = require("@inquirer/core");
const select_1 = __importDefault(require("@inquirer/select"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const envars_1 = require("./envars");
const logger_1 = __importDefault(require("./logger"));
const init_1 = require("./redteam/commands/init");
const telemetry_1 = __importDefault(require("./telemetry"));
const promptfooCommand_1 = require("./util/promptfooCommand");
const templates_1 = require("./util/templates");
const CONFIG_TEMPLATE = `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json

# Learn more about building a configuration: https://promptfoo.dev/docs/configuration/guide

description: "My eval"

prompts:
  {% for prompt in prompts -%}
  - {{prompt | dump }}
  {% endfor %}

providers:
  {% for provider in providers -%}
  - {{provider | dump }}
  {% endfor %}

tests:
{%- if type == 'rag' or type == 'agent' %}
  - vars:
      inquiry: "I have a problem with my order"
      {% if language == 'python' -%}
      context: file://context.py
      {%- elif language == 'javascript' -%}
      context: file://context.js
      {%- else -%}
      context: file://context.py
      {%- endif %}

  - vars:
      inquiry: "I want to return my widget"
      # See how to use dynamic context to e.g. use a vector store https://promptfoo.dev/docs/guides/evaluate-rag/#using-dynamic-context
      {% if language == 'javascript' -%}
      context: file://context.js
      {%- else -%}
      context: file://context.py
      {%- endif %}
    assert:
      # For more information on assertions, see https://promptfoo.dev/docs/configuration/expected-outputs

      # Make sure output contains the phrase "return label"
      - type: icontains
        value: "return label"

      # Prefer shorter outputs
      {% if language == 'python' -%}
      - type: python
        value: 1 / (len(output) + 1)
      {%- else -%}
      - type: javascript
        value: 1 / (output.length + 1)
      {%- endif %}

  - vars:
      inquiry: "I need help with my account"
      context: |
        You can also hardcode context directly in the configuration.
        Username: Foobar
        Account ID: 123456
    assert:
      # For more information on model-graded evals, see https://promptfoo.dev/docs/configuration/expected-outputs/model-graded
      - type: llm-rubric
        value: ensure that the output is friendly and empathetic
{%- else %}
  - vars:
      topic: bananas

  - vars:
      topic: avocado toast
    assert:
      # For more information on assertions, see https://promptfoo.dev/docs/configuration/expected-outputs

      # Make sure output contains the word "avocado"
      - type: icontains
        value: avocado

      # Prefer shorter outputs
      - type: javascript
        value: 1 / (output.length + 1)

  - vars:
      topic: new york city
    assert:
      # For more information on model-graded evals, see https://promptfoo.dev/docs/configuration/expected-outputs/model-graded
      - type: llm-rubric
        value: ensure that the output is funny
{% endif %}
`;
const PYTHON_PROVIDER = `# Learn more about building a Python provider: https://promptfoo.dev/docs/providers/python/
import json

def call_api(prompt, options, context):
    # The 'options' parameter contains additional configuration for the API call.
    config = options.get('config', None)
    additional_option = config.get('additionalOption', None)

    # The 'context' parameter provides info about which vars were used to create the final prompt.
    user_variable = context['vars'].get('userVariable', None)

    # The prompt is the final prompt string after the variables have been processed.
    # Custom logic to process the prompt goes here.
    # For instance, you might call an external API or run some computations.
    # TODO: Replace with actual LLM API implementation.
    def call_llm(prompt):
        return f"Stub response for prompt: {prompt}"
    output = call_llm(prompt)

    # The result should be a dictionary with at least an 'output' field.
    result = {
        "output": output,
    }

    if some_error_condition:
        result['error'] = "An error occurred during processing"

    if token_usage_calculated:
        # If you want to report token usage, you can set the 'tokenUsage' field.
        result['tokenUsage'] = {"total": token_count, "prompt": prompt_token_count, "completion": completion_token_count}

    if failed_guardrails:
        # If guardrails triggered, you can set the 'guardrails' field.
        result['guardrails'] = {"flagged": True}

    return result
`;
const JAVASCRIPT_PROVIDER = `// Learn more about building a JavaScript provider: https://promptfoo.dev/docs/providers/custom-api
// customApiProvider.js

class CustomApiProvider {
  constructor(options) {
    // Provider ID can be overridden by the config file (e.g. when using multiple of the same provider)
    this.providerId = options.id || 'custom provider';

    // options.config contains any custom options passed to the provider
    this.config = options.config;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    // Add your custom API logic here
    // Use options like: \`this.config.temperature\`, \`this.config.max_tokens\`, etc.

    console.log('Vars for this test case:', JSON.stringify(context.vars));

    return {
      // Required
      output: 'Model output',

      // Optional
      tokenUsage: {
        total: 10,
        prompt: 5,
        completion: 5,
      },
    };
  }
}

module.exports = CustomApiProvider;
`;
const BASH_PROVIDER = `# Learn more about building any generic provider: https://promptfoo.dev/docs/providers/custom-script

# Anything printed to standard output will be captured as the output of the provider

echo "This is the LLM output"

# You can also call external scripts or executables
php my_script.php
`;
const WINDOWS_PROVIDER = `@echo off
REM Learn more about building any generic provider: https://promptfoo.dev/docs/providers/custom-script

REM Anything printed to standard output will be captured as the output of the provider

echo This is the LLM output

REM You can also call external scripts or executables
REM php my_script.php
`;
const PYTHON_VAR = `# Learn more about using dynamic variables: https://promptfoo.dev/docs/configuration/guide/#import-vars-from-separate-files
def get_var(var_name, prompt, other_vars):
    # This is where you can fetch documents from a database, call an API, etc.
    # ...

    if var_name == 'context':
        # Return value based on the variable name and test context
        return {
            'output': f"... Documents for {other_vars['inquiry']} in prompt: {prompt} ..."
        }

    # Default variable value
    return {'output': 'Document A, Document B, Document C, ...'}

    # Handle potential errors
    # return { 'error': 'Error message' }
`;
const JAVASCRIPT_VAR = `// Learn more about using dynamic variables: https://promptfoo.dev/docs/configuration/guide/#import-vars-from-separate-files
module.exports = function (varName, prompt, otherVars) {
  // This is where you can fetch documents from a database, call an API, etc.
  // ...

  if (varName === 'context') {
    // Return value based on the variable name and test context
    return {
      output: \`... Documents for \${otherVars.inquiry} for prompt: \${prompt} ...\`
    };
  }

  // Default variable value
  return {
    output: 'Document A, Document B, Document C, ...',
  };

  // Handle potential errors
  // return { error: 'Error message' }
};
`;
const DEFAULT_README = `To get started, set your OPENAI_API_KEY environment variable, or other required keys for the providers you selected.

Next, edit promptfooconfig.yaml.

Then run:
\`\`\`
promptfoo eval
\`\`\`

Afterwards, you can view the results by running \`promptfoo view\`
`;
function recordOnboardingStep(step, properties = {}) {
    telemetry_1.default.record('funnel', {
        type: 'eval onboarding',
        step,
        ...properties,
    });
}
/**
 * Iterate through user choices and determine if the user has selected a provider that needs an API key
 * but has not set and API key in their environment.
 */
function reportProviderAPIKeyWarnings(providerChoices) {
    const ids = providerChoices.map((c) => (typeof c === 'object' ? c.id : c));
    const map = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
    };
    return Object.entries(map)
        .filter(([prefix, key]) => ids.some((id) => id.startsWith(prefix)) && !(0, envars_1.getEnvString)(key))
        .map(([_prefix, key]) => (0, dedent_1.default) `
    ${chalk_1.default.bold(`Warning: ${key} environment variable is not set.`)}
    Please set this environment variable like: export ${key}=<my-api-key>
  `);
}
async function askForPermissionToOverwrite({ absolutePath, relativePath, required, }) {
    if (!fs_1.default.existsSync(absolutePath)) {
        return true;
    }
    const requiredText = required ? '(required)' : '(optional)';
    const hasPermissionToWrite = await (0, confirm_1.default)({
        message: `${relativePath} ${requiredText} already exists. Do you want to overwrite it?`,
        default: false,
    });
    return hasPermissionToWrite;
}
async function createDummyFiles(directory, interactive = true) {
    console.clear();
    const outDirectory = directory || '.';
    const outDirAbsolute = path_1.default.join(process.cwd(), outDirectory);
    async function writeFile({ file, contents, required, }) {
        const relativePath = path_1.default.join(outDirectory, file);
        const absolutePath = path_1.default.join(outDirAbsolute, file);
        if (interactive) {
            const hasPermissionToWrite = await askForPermissionToOverwrite({
                absolutePath,
                relativePath,
                required,
            });
            if (!hasPermissionToWrite) {
                if (required) {
                    logger_1.default.warn(`⚠️ Skipping required file ${relativePath} - configuration may be incomplete`);
                }
                else {
                    logger_1.default.info(`⏩ Skipping ${relativePath}`);
                }
                return;
            }
        }
        fs_1.default.writeFileSync(absolutePath, contents);
        logger_1.default.info(`⌛ Wrote ${relativePath}`);
    }
    const prompts = [];
    const providers = [];
    let action;
    let language;
    if (!fs_1.default.existsSync(outDirAbsolute)) {
        fs_1.default.mkdirSync(outDirAbsolute, { recursive: true });
    }
    if (interactive) {
        recordOnboardingStep('start');
        // Choose use case
        action = await (0, select_1.default)({
            message: 'What would you like to do?',
            choices: [
                { name: 'Not sure yet', value: 'compare' },
                { name: 'Improve prompt and model performance', value: 'compare' },
                { name: 'Improve RAG performance', value: 'rag' },
                { name: 'Improve agent/chain of thought performance', value: 'agent' },
                { name: 'Run a red team evaluation', value: 'redteam' },
            ],
        });
        recordOnboardingStep('choose app type', {
            value: action,
        });
        if (action === 'redteam') {
            await (0, init_1.redteamInit)(outDirectory);
            return {
                numPrompts: 0,
                providerPrefixes: [],
                action: 'redteam',
                language: 'not_applicable',
            };
        }
        language = 'not_sure';
        if (action === 'rag' || action === 'agent') {
            language = await (0, select_1.default)({
                message: 'What programming language are you developing the app in?',
                choices: [
                    { name: 'Not sure yet', value: 'not_sure' },
                    { name: 'Python', value: 'python' },
                    { name: 'Javascript', value: 'javascript' },
                ],
            });
            recordOnboardingStep('choose language', {
                value: language,
            });
        }
        const choices = [
            { name: `I'll choose later`, value: ['openai:gpt-5-mini', 'openai:gpt-5'] },
            {
                name: '[OpenAI] GPT 5, GPT 4.1, ...',
                value: action === 'agent'
                    ? [
                        {
                            id: 'openai:gpt-5',
                            config: {
                                tools: [
                                    {
                                        type: 'function',
                                        function: {
                                            name: 'get_current_weather',
                                            description: 'Get the current weather in a given location',
                                            parameters: {
                                                type: 'object',
                                                properties: {
                                                    location: {
                                                        type: 'string',
                                                        description: 'The city and state, e.g. San Francisco, CA',
                                                    },
                                                },
                                                required: ['location'],
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    ]
                    : ['openai:gpt-5-mini', 'openai:gpt-5'],
            },
            {
                name: '[Anthropic] Claude Opus, Sonnet, Haiku, ...',
                value: [
                    'anthropic:messages:claude-sonnet-4-5-20250929',
                    'anthropic:messages:claude-opus-4-1-20250805',
                    'anthropic:messages:claude-opus-4-20250514',
                    'anthropic:messages:claude-3-7-sonnet-20250219',
                ],
            },
            { name: '[Google] Gemini 2.5 Pro, ...', value: ['vertex:gemini-2.5-pro'] },
            {
                name: '[HuggingFace] Llama, Phi, Gemma, ...',
                value: [
                    'huggingface:text-generation:meta-llama/Meta-Llama-3.1-8B-Instruct',
                    'huggingface:text-generation:microsoft/Phi-4-mini-instruct',
                    'huggingface:text-generation:google/gemma-3-4b-it',
                ],
            },
            {
                name: 'Local Python script',
                value: ['file://provider.py'],
            },
            {
                name: 'Local Javascript script',
                value: ['file://provider.js'],
            },
            {
                name: 'Local executable',
                value: [process.platform === 'win32' ? 'exec:provider.bat' : 'exec:provider.sh'],
            },
            {
                name: 'HTTP endpoint',
                value: ['https://example.com/api/generate'],
            },
            {
                name: '[Azure] OpenAI, DeepSeek, Llama, ...',
                value: [
                    {
                        id: 'azure:chat:deploymentNameHere',
                        config: {
                            apiHost: 'xxxxxxxx.openai.azure.com',
                        },
                    },
                ],
            },
            {
                name: '[AWS Bedrock] Claude, Llama, Titan, ...',
                value: ['bedrock:us.anthropic.claude-sonnet-4-5-20250929-v1:0'],
            },
            {
                name: '[Cohere] Command R, Command R+, ...',
                value: ['cohere:command-r', 'cohere:command-r-plus'],
            },
            {
                name: '[Ollama] Llama, Qwen, Phi, ...',
                value: ['ollama:chat:llama3.3', 'ollama:chat:phi4'],
            },
            {
                name: '[WatsonX] Llama, IBM Granite, ...',
                value: [
                    'watsonx:meta-llama/llama-3-2-11b-vision-instruct',
                    'watsonx:ibm/granite-3-3-8b-instruct',
                ],
            },
        ];
        /**
         * The potential of the object type here is given by the agent action conditional
         * for openai as a value choice
         */
        const providerChoice = await (0, select_1.default)({
            message: 'Which model provider would you like to use?',
            choices,
            loop: false,
            pageSize: process.stdout.rows - 6,
        });
        const providerChoices = Array.isArray(providerChoice)
            ? providerChoice
            : [providerChoice];
        recordOnboardingStep('choose providers', {
            value: providerChoices.map((choice) => typeof choice === 'string' ? choice : JSON.stringify(choice)),
        });
        // Tell the user if they have providers selected without relevant API keys set in env.
        reportProviderAPIKeyWarnings(providerChoices).forEach((warningText) => logger_1.default.warn(warningText));
        if (providerChoices.length > 0) {
            if (providerChoices.length > 3) {
                providers.push(...providerChoices.map((choice) => (Array.isArray(choice) ? choice[0] : choice)));
            }
            else {
                providers.push(...providerChoices);
            }
            if (providerChoices.some((choice) => typeof choice === 'string' && choice.startsWith('file://') && choice.endsWith('.js'))) {
                await writeFile({
                    file: 'provider.js',
                    contents: JAVASCRIPT_PROVIDER,
                    required: true,
                });
            }
            if (providerChoices.some((choice) => typeof choice === 'string' && choice.startsWith('exec:'))) {
                // Generate platform-appropriate executable provider script
                const isWindows = process.platform === 'win32';
                await writeFile({
                    file: isWindows ? 'provider.bat' : 'provider.sh',
                    contents: isWindows ? WINDOWS_PROVIDER : BASH_PROVIDER,
                    required: true,
                });
            }
            if (providerChoices.some((choice) => typeof choice === 'string' &&
                (choice.startsWith('python:') ||
                    (choice.startsWith('file://') && choice.endsWith('.py'))))) {
                await writeFile({
                    file: 'provider.py',
                    contents: PYTHON_PROVIDER,
                    required: true,
                });
            }
        }
        else {
            providers.push('openai:gpt-5-mini');
            providers.push('openai:gpt-5');
        }
        if (action === 'compare') {
            prompts.push(`Write a tweet about {{topic}}`);
            if (providers.length < 3) {
                prompts.push(`Write a concise, funny tweet about {{topic}}`);
            }
        }
        else if (action === 'rag') {
            prompts.push('Write a customer service response to:\n\n{{inquiry}}\n\nUse these documents:\n\n{{context}}');
        }
        else if (action === 'agent') {
            prompts.push(`Fulfill this user helpdesk ticket: {{inquiry}}`);
        }
        if (action === 'rag' || action === 'agent') {
            if (language === 'javascript') {
                await writeFile({
                    file: 'context.js',
                    contents: JAVASCRIPT_VAR,
                    required: true,
                });
            }
            else {
                await writeFile({
                    file: 'context.py',
                    contents: PYTHON_VAR,
                    required: true,
                });
            }
        }
        recordOnboardingStep('complete');
    }
    else {
        action = 'compare';
        language = 'not_sure';
        prompts.push(`Write a tweet about {{topic}}`);
        prompts.push(`Write a concise, funny tweet about {{topic}}`);
        providers.push('openai:gpt-5-mini');
        providers.push('openai:gpt-5');
    }
    const nunjucks = (0, templates_1.getNunjucksEngine)();
    const config = nunjucks.renderString(CONFIG_TEMPLATE, {
        prompts,
        providers,
        type: action,
        language,
    });
    await writeFile({
        file: 'README.md',
        contents: DEFAULT_README,
        required: false,
    });
    await writeFile({
        file: 'promptfooconfig.yaml',
        contents: config,
        required: true,
    });
    return {
        numPrompts: prompts.length,
        providerPrefixes: providers.map((p) => (typeof p === 'string' ? p.split(':')[0] : 'unknown')),
        action,
        language,
        outDirectory,
    };
}
async function initializeProject(directory, interactive = true) {
    try {
        const result = await createDummyFiles(directory, interactive);
        const { outDirectory, ...telemetryDetails } = result;
        const runCommand = (0, promptfooCommand_1.promptfooCommand)('eval');
        if (outDirectory === '.') {
            logger_1.default.info(chalk_1.default.green(`✅ Run \`${chalk_1.default.bold(runCommand)}\` to get started!`));
        }
        else {
            logger_1.default.info(`✅ Wrote promptfooconfig.yaml to ./${outDirectory}`);
            logger_1.default.info(chalk_1.default.green(`Run \`${chalk_1.default.bold(`cd ${outDirectory}`)}\` and then \`${chalk_1.default.bold(runCommand)}\` to get started!`));
        }
        return telemetryDetails;
    }
    catch (err) {
        if (err instanceof core_1.ExitPromptError) {
            const runCommand = (0, promptfooCommand_1.promptfooCommand)('init');
            logger_1.default.info('\n' +
                chalk_1.default.blue('Initialization paused. To continue setup later, use the command: ') +
                chalk_1.default.bold(runCommand));
            logger_1.default.info(chalk_1.default.blue('For help or feedback, visit ') +
                chalk_1.default.green('https://www.promptfoo.dev/contact/'));
            await recordOnboardingStep('early exit');
            process.exit(130);
        }
        else {
            throw err;
        }
    }
}
//# sourceMappingURL=onboarding.js.map