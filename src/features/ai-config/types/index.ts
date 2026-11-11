export interface AiConfig {
  id: number;
  configKey: string;
  configName: string;
  provider: 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'DEEPSEEK' | string;
  modelName: string;
  apiKey: string;
  systemPrompt: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AiConfigFormInput = Omit<AiConfig, 'id' | 'createdAt' | 'updatedAt'>;

export interface AiConfigFilter {
  search: string;
  configKey: string;
  provider: string;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export interface PromptTestResult {
  output: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  simulated: boolean;
}

