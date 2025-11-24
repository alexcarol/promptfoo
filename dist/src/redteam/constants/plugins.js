"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI_DISABLED_WHEN_REMOTE_UNAVAILABLE = exports.REMOTE_ONLY_PLUGIN_IDS = exports.PLUGIN_CATEGORIES = exports.ALL_PLUGINS = exports.DEFAULT_PLUGINS = exports.STRATEGY_EXEMPT_PLUGINS = exports.DATASET_EXEMPT_PLUGINS = exports.AGENTIC_EXEMPT_PLUGINS = exports.CONFIG_REQUIRED_PLUGINS = exports.ADDITIONAL_PLUGINS = exports.BASE_PLUGINS = exports.INSURANCE_PLUGINS = exports.PHARMACY_PLUGINS = exports.FINANCIAL_PLUGINS = exports.MEDICAL_PLUGINS = exports.BIAS_PLUGINS = exports.PII_PLUGINS = exports.HARM_PLUGINS = exports.REDTEAM_PROVIDER_HARM_PLUGINS = exports.UNALIGNED_PROVIDER_HARM_PLUGINS = exports.COLLECTIONS = exports.HUGGINGFACE_GATED_PLUGINS = exports.AGENTIC_PLUGINS = exports.MCP_PLUGINS = exports.GUARDRAILS_EVALUATION_PLUGINS = exports.FOUNDATION_PLUGINS = exports.LLAMA_GUARD_ENABLED_CATEGORIES = exports.LLAMA_GUARD_REPLICATE_PROVIDER = exports.REDTEAM_MODEL = exports.REDTEAM_DEFAULTS = exports.DEFAULT_NUM_TESTS_PER_PLUGIN = void 0;
exports.DEFAULT_NUM_TESTS_PER_PLUGIN = 5;
// Redteam configuration defaults
exports.REDTEAM_DEFAULTS = {
    MAX_CONCURRENCY: 4,
    NUM_TESTS: 10,
};
exports.REDTEAM_MODEL = 'openai:chat:gpt-4.1-2025-04-14';
// LlamaGuard 4 is the default on Replicate (supports S14: Code Interpreter Abuse)
exports.LLAMA_GUARD_REPLICATE_PROVIDER = 'replicate:moderation:meta/llama-guard-4-12b';
// For LlamaGuard 3 compatibility:
// export const LLAMA_GUARD_REPLICATE_PROVIDER =
//   'replicate:moderation:meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8';
exports.LLAMA_GUARD_ENABLED_CATEGORIES = [
    'S1', // Violent Crimes
    'S2', // Non-Violent Crimes
    'S3', // Sex Crimes
    'S4', // Child Exploitation
    'S5', // Defamation
    'S6', // Specialized Advice
    // S7: 'Privacy' - disabled due to false positives from allowed entities
    'S8', // Intellectual Property
    'S9', // Indiscriminate Weapons
    'S10', // Hate
    'S11', // Self-Harm
    'S12', // Sexual Content
    'S13', // Elections
];
exports.FOUNDATION_PLUGINS = [
    'ascii-smuggling',
    'beavertails',
    'bias:age',
    'bias:disability',
    'bias:gender',
    'bias:race',
    'contracts',
    'cyberseceval',
    'donotanswer',
    'divergent-repetition',
    'excessive-agency',
    'hallucination',
    'harmful:chemical-biological-weapons',
    'harmful:child-exploitation',
    'harmful:copyright-violations',
    'harmful:cybercrime',
    'harmful:cybercrime:malicious-code',
    'harmful:graphic-content',
    'harmful:harassment-bullying',
    'harmful:hate',
    'harmful:illegal-activities',
    'harmful:illegal-drugs',
    'harmful:illegal-drugs:meth',
    'harmful:indiscriminate-weapons',
    'harmful:insults',
    'harmful:intellectual-property',
    'harmful:misinformation-disinformation',
    'harmful:non-violent-crime',
    'harmful:profanity',
    'harmful:radicalization',
    'harmful:self-harm',
    'harmful:sex-crime',
    'harmful:sexual-content',
    'harmful:specialized-advice',
    'harmful:unsafe-practices',
    'harmful:violent-crime',
    'harmful:weapons:ied',
    'hijacking',
    'imitation',
    'overreliance',
    'pii:direct',
    'pliny',
    'politics',
    'religion',
];
exports.GUARDRAILS_EVALUATION_PLUGINS = [
    // === PROMPT INJECTION & JAILBREAKING ===
    'ascii-smuggling',
    'indirect-prompt-injection',
    'cca',
    'hijacking',
    'system-prompt-override',
    'beavertails',
    'harmbench',
    'pliny',
    'donotanswer',
    'prompt-extraction',
    // === HARMFUL CONTENT ===
    // WMD & Weapons
    'harmful:chemical-biological-weapons',
    'harmful:indiscriminate-weapons',
    'harmful:weapons:ied',
    // Violence & Crime
    'harmful:violent-crime',
    'harmful:sex-crime',
    'harmful:non-violent-crime',
    'harmful:graphic-content',
    'harmful:unsafe-practices',
    // Exploitation & Abuse
    'harmful:child-exploitation',
    'harmful:harassment-bullying',
    'harmful:hate',
    'harmful:self-harm',
    'harmful:sexual-content',
    'harmful:insults',
    'harmful:profanity',
    // Radicalization & Extremism
    'harmful:radicalization',
    // Cybercrime & Security
    'harmful:cybercrime',
    'harmful:cybercrime:malicious-code',
    // Substances
    'harmful:illegal-activities',
    'harmful:illegal-drugs',
    'harmful:illegal-drugs:meth',
    // Information Integrity
    'harmful:misinformation-disinformation',
    'harmful:specialized-advice',
    // Legal & IP
    'harmful:copyright-violations',
    'harmful:intellectual-property',
    // === SYSTEM SECURITY & INTEGRITY ===
    'cyberseceval',
    'excessive-agency',
    'hallucination',
    'overreliance',
    'divergent-repetition',
    'reasoning-dos',
    // === PII & PRIVACY PROTECTION (UK/EU Compliance) ===
    'harmful:privacy',
];
exports.MCP_PLUGINS = ['mcp', 'pii', 'bfla', 'bola', 'sql-injection', 'rbac'];
exports.AGENTIC_PLUGINS = ['agentic:memory-poisoning'];
// Plugins that require HuggingFace API keys for their datasets
exports.HUGGINGFACE_GATED_PLUGINS = ['beavertails', 'unsafebench', 'aegis'];
exports.COLLECTIONS = [
    'default',
    'foundation',
    'harmful',
    'pii',
    'bias',
    'medical',
    'pharmacy',
    'insurance',
    'financial',
    'guardrails-eval',
];
exports.UNALIGNED_PROVIDER_HARM_PLUGINS = {
    // MLCommons harm categories
    // https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-3/
    'harmful:child-exploitation': 'Child Exploitation',
    'harmful:hate': 'Hate',
    'harmful:indiscriminate-weapons': 'Indiscriminate Weapons',
    'harmful:non-violent-crime': 'Non-Violent Crimes',
    'harmful:self-harm': 'Self-Harm',
    'harmful:sex-crime': 'Sex Crimes',
    'harmful:sexual-content': 'Sexual Content',
    'harmful:violent-crime': 'Violent Crimes',
    // Harmbench taxonomy
    // https://arxiv.org/pdf/2402.04249
    'harmful:chemical-biological-weapons': 'Chemical & Biological Weapons',
    'harmful:copyright-violations': 'Copyright Violations - Copyrighted text',
    'harmful:cybercrime': 'Cybercrime & Unauthorized Intrusion - Hacking and Malware',
    'harmful:graphic-content': 'Graphic & age-restricted content',
    'harmful:harassment-bullying': 'Harassment & Bullying',
    'harmful:illegal-activities': 'Illegal Activities - Fraud & scams',
    'harmful:illegal-drugs': 'Illegal Drugs',
    'harmful:unsafe-practices': 'Promotion of unsafe practices',
    // Other
    'harmful:insults': 'Insults and personal attacks',
    'harmful:profanity': 'Requests containing profanity',
    'harmful:radicalization': 'Radicalization',
    'harmful:illegal-drugs:meth': 'Methamphetamine',
    'harmful:weapons:ied': 'Improvised Explosive Devices',
    'harmful:cybercrime:malicious-code': 'Malicious Code',
    // Commented out
    //'harmful:privacy-violations': 'Privacy violations & data exploitation',  // redundant with MLCommons category
    //'locale_specific_illegal (e.g. hate speech in Germany, alcohol in Saudi Arabia)',
    //'scam_fraud_creation',
};
exports.REDTEAM_PROVIDER_HARM_PLUGINS = {
    'harmful:intellectual-property': 'Intellectual Property violation',
    'harmful:privacy': 'Privacy violations',
};
exports.HARM_PLUGINS = {
    'harmful:misinformation-disinformation': 'Misinformation & Disinformation - Harmful lies and propaganda',
    'harmful:specialized-advice': 'Specialized Advice - Financial',
    ...exports.UNALIGNED_PROVIDER_HARM_PLUGINS,
    ...exports.REDTEAM_PROVIDER_HARM_PLUGINS,
};
exports.PII_PLUGINS = ['pii:api-db', 'pii:direct', 'pii:session', 'pii:social'];
exports.BIAS_PLUGINS = ['bias:age', 'bias:disability', 'bias:gender', 'bias:race'];
exports.MEDICAL_PLUGINS = [
    'medical:anchoring-bias',
    'medical:hallucination',
    'medical:incorrect-knowledge',
    'medical:off-label-use',
    'medical:prioritization-error',
    'medical:sycophancy',
];
exports.FINANCIAL_PLUGINS = [
    'financial:calculation-error',
    'financial:compliance-violation',
    'financial:confidential-disclosure',
    'financial:counterfactual',
    'financial:data-leakage',
    'financial:defamation',
    'financial:hallucination',
    'financial:impartiality',
    'financial:misconduct',
    'financial:sycophancy',
];
exports.PHARMACY_PLUGINS = [
    'pharmacy:controlled-substance-compliance',
    'pharmacy:dosage-calculation',
    'pharmacy:drug-interaction',
];
exports.INSURANCE_PLUGINS = [
    'insurance:coverage-discrimination',
    'insurance:network-misinformation',
    'insurance:phi-disclosure',
];
exports.BASE_PLUGINS = [
    'contracts',
    'excessive-agency',
    'hallucination',
    'hijacking',
    'politics',
];
exports.ADDITIONAL_PLUGINS = [
    'aegis',
    'ascii-smuggling',
    'beavertails',
    'bfla',
    'bola',
    'cca',
    'competitors',
    'coppa',
    'cross-session-leak',
    'cyberseceval',
    'debug-access',
    'divergent-repetition',
    'donotanswer',
    'ferpa',
    'harmbench',
    'toxic-chat',
    'imitation',
    'indirect-prompt-injection',
    'mcp',
    'medical:anchoring-bias',
    'medical:hallucination',
    'medical:incorrect-knowledge',
    'medical:off-label-use',
    'medical:prioritization-error',
    'medical:sycophancy',
    'financial:calculation-error',
    'financial:compliance-violation',
    'financial:confidential-disclosure',
    'financial:counterfactual',
    'financial:data-leakage',
    'financial:defamation',
    'financial:hallucination',
    'financial:impartiality',
    'financial:misconduct',
    'financial:sycophancy',
    'goal-misalignment',
    'insurance:coverage-discrimination',
    'insurance:network-misinformation',
    'insurance:phi-disclosure',
    'off-topic',
    'overreliance',
    'pharmacy:controlled-substance-compliance',
    'pharmacy:dosage-calculation',
    'pharmacy:drug-interaction',
    'pliny',
    'prompt-extraction',
    'rag-document-exfiltration',
    'rag-poisoning',
    'rbac',
    'reasoning-dos',
    'religion',
    'shell-injection',
    'special-token-injection',
    'sql-injection',
    'ssrf',
    'system-prompt-override',
    'tool-discovery',
    'unsafebench',
    'unverifiable-claims',
    'vlguard',
    'wordplay',
    'xstest',
];
// Plugins that require configuration and can't be enabled by default or included as additional.
exports.CONFIG_REQUIRED_PLUGINS = ['intent', 'policy'];
// Agentic plugins that don't use strategies (standalone agentic plugins)
exports.AGENTIC_EXEMPT_PLUGINS = [
    'system-prompt-override',
    'agentic:memory-poisoning',
];
// Dataset plugins that don't use strategies (standalone dataset plugins)
exports.DATASET_EXEMPT_PLUGINS = [
    'beavertails',
    'cyberseceval',
    'pliny',
    'unsafebench',
    'vlguard',
];
// Plugins that don't use strategies (standalone plugins) - combination of agentic and dataset
exports.STRATEGY_EXEMPT_PLUGINS = [
    ...exports.AGENTIC_EXEMPT_PLUGINS,
    ...exports.DATASET_EXEMPT_PLUGINS,
];
exports.DEFAULT_PLUGINS = new Set([
    ...[
        ...exports.BASE_PLUGINS,
        ...Object.keys(exports.HARM_PLUGINS),
        ...exports.PII_PLUGINS,
        ...exports.BIAS_PLUGINS,
    ].sort(),
]);
exports.ALL_PLUGINS = [
    ...new Set([
        ...exports.DEFAULT_PLUGINS,
        ...exports.ADDITIONAL_PLUGINS,
        ...exports.CONFIG_REQUIRED_PLUGINS,
        ...exports.AGENTIC_PLUGINS,
    ]),
].sort();
exports.PLUGIN_CATEGORIES = {
    bias: exports.BIAS_PLUGINS,
    financial: exports.FINANCIAL_PLUGINS,
    harmful: Object.keys(exports.HARM_PLUGINS),
    pii: exports.PII_PLUGINS,
    medical: exports.MEDICAL_PLUGINS,
    pharmacy: exports.PHARMACY_PLUGINS,
    insurance: exports.INSURANCE_PLUGINS,
};
// Plugins registered via createRemotePlugin() in plugins/index.ts
// These have no local implementation and always call the remote API
exports.REMOTE_ONLY_PLUGIN_IDS = [
    'agentic:memory-poisoning',
    'ascii-smuggling',
    'bfla',
    'bola',
    'cca',
    'competitors',
    'coppa',
    'ferpa',
    'goal-misalignment',
    'harmful:misinformation-disinformation',
    'harmful:specialized-advice',
    'hijacking',
    'indirect-prompt-injection',
    'mcp',
    'off-topic',
    'rag-document-exfiltration',
    'rag-poisoning',
    'reasoning-dos',
    'religion',
    'special-token-injection',
    'ssrf',
    'system-prompt-override',
    'wordplay',
    ...exports.MEDICAL_PLUGINS,
    ...exports.FINANCIAL_PLUGINS,
    ...exports.PHARMACY_PLUGINS,
    ...exports.INSURANCE_PLUGINS,
];
// Plugins that frontend should disable when remote generation is unavailable
// Superset of REMOTE_ONLY_PLUGIN_IDS plus harm/bias plugins
// Used by frontend UI to gray out plugins when PROMPTFOO_DISABLE_REMOTE_GENERATION is set
exports.UI_DISABLED_WHEN_REMOTE_UNAVAILABLE = [
    ...Object.keys(exports.UNALIGNED_PROVIDER_HARM_PLUGINS),
    ...exports.BIAS_PLUGINS,
    ...exports.REMOTE_ONLY_PLUGIN_IDS,
];
//# sourceMappingURL=plugins.js.map