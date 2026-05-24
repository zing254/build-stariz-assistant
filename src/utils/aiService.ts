import { ApiConfig } from '../components/ApiKeyManager';
import { ollamaService } from './ollama';

interface AIServiceResponse {
  content: string;
  model: string;
  provider: 'ollama' | 'api';
  tokens?: { prompt: number; completion: number };
}

interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private ollama: typeof ollamaService;
  private currentApiConfig: ApiConfig | null = null;

  constructor() {
    this.ollama = ollamaService;
  }

  setApiConfig(config: ApiConfig | null) {
    this.currentApiConfig = config;
  }

  async isOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async isOllamaAvailable(): Promise<boolean> {
    return this.ollama.isAvailableNow();
  }

  async getAvailableModels(): Promise<
    ({ name: string; provider: 'ollama' } | { name: string; provider: 'api'; id: string })[]
  > {
    const [ollamaModels, apiModels] = await Promise.all([
      this.ollama.listModels(),
      this.getApiModels(),
    ]);

    const ollama = ollamaModels.map((model) => ({
      name: model.name,
      provider: 'ollama' as const,
    }));

    const api = apiModels.map((model) => ({
      name: model.name,
      provider: 'api' as const,
      id: model.id,
    }));

    return [...ollama, ...api] as ({ name: string; provider: 'ollama' } | { name: string; provider: 'api'; id: string })[];
  }

  private async getApiModels(): Promise<Array<{ name: string; id: string }>> {
    if (!this.currentApiConfig) {
      return [];
    }

    // Return common models for each provider
    switch (this.currentApiConfig.provider) {
      case 'openrouter':
        return [
          { name: 'Claude 3.5 Sonnet', id: 'anthropic/claude-3.5-sonnet' },
          { name: 'GPT-4 Turbo', id: 'openai/gpt-4-turbo' },
          { name: 'Gemini Pro', id: 'google/gemini-pro' },
        ];
      case 'anthropic':
        return [{ name: 'Claude 3 Opus', id: 'claude-3-opus-20240229' }];
      case 'google':
        return [{ name: 'Gemini Pro', id: 'gemini-pro' }];
      default:
        return [];
    }
  }

  async generateResponse(
    prompt: string,
    systemPrompt: string = '',
    options: AIServiceOptions = {}
  ): Promise<AIServiceResponse> {
    const { temperature = 0.7 } = options;

    // Check if we should use offline mode
    const isOnline = await this.isOnline();
    const ollamaAvailable = await this.isOllamaAvailable();

    // Prefer Ollama when offline or explicitly chosen
    if (!isOnline || (ollamaAvailable && !this.currentApiConfig)) {
      try {
        const response = await this.ollama.generateResponse(
          'qwen3:4b',
          prompt,
          systemPrompt,
          temperature
        );

        return {
          content: response.response,
          model: response.model,
          provider: 'ollama',
          tokens: {
            prompt: response.prompt_eval_count || 0,
            completion: response.eval_count || 0,
          },
        };
      } catch (error) {
        console.error('Ollama generation failed:', error);
        // Fall back to API if available
        if (isOnline && this.currentApiConfig) {
          return this.generateApiResponse(prompt, systemPrompt, options);
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    // Use API when online and configured
    if (isOnline && this.currentApiConfig) {
      return this.generateApiResponse(prompt, systemPrompt, options);
    }

    // Last resort: try Ollama even if we thought it wasn't available
    if (ollamaAvailable) {
      try {
        const response = await this.ollama.generateResponse(
          'qwen3:4b',
          prompt,
          systemPrompt,
          temperature
        );

        return {
          content: response.response,
          model: response.model,
          provider: 'ollama',
          tokens: {
            prompt: response.prompt_eval_count || 0,
            completion: response.eval_count || 0,
          },
        };
      } catch (error) {
        console.error('Ollama fallback failed:', error);
      }
    }

    throw new Error(
      'No AI service available. Check your internet connection or start Ollama.'
    );
  }

  private async generateApiResponse(
    prompt: string,
    systemPrompt: string = '',
    options: AIServiceOptions = {}
  ): Promise<AIServiceResponse> {
    if (!this.currentApiConfig) {
      throw new Error('No API configuration available');
    }

    const { temperature = 0.7, maxTokens = 1024 } = options;
    const config = this.currentApiConfig;

    let url: string;
    let body: any;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      switch (config.provider) {
        case 'openrouter':
          url = `${config.baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`;
          headers['Authorization'] = `Bearer ${config.key}`;
          body = {
            model: config.model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature,
            max_tokens: maxTokens,
          };
          break;

        case 'anthropic':
          url = `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`;
          headers['x-api-key'] = config.key;
          headers['anthropic-version'] = '2023-06-01';
          body = {
            model: config.model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          };
          break;

        case 'google':
          url = `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.model}:generateContent?key=${config.key}`;
          body = {
            contents: [
              {
                parts: [
                  ...(systemPrompt ? [{ text: systemPrompt }] : []),
                  { text: prompt },
                ],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          };
          break;

        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      // Extract response based on provider
      let content: string = '';
      let modelUsed: string = config.model;
      let promptTokens: number = 0;
      let completionTokens: number = 0;

      switch (config.provider) {
        case 'openrouter':
          content = data.choices[0]?.message?.content || '';
          modelUsed = data.model || config.model;
          promptTokens = data.usage?.prompt_tokens || 0;
          completionTokens = data.usage?.completion_tokens || 0;
          break;

        case 'anthropic':
          content = data.content[0]?.text || '';
          modelUsed = data.model || config.model;
          promptTokens = data.usage?.input_tokens || 0;
          completionTokens = data.usage?.output_tokens || 0;
          break;

        case 'google':
          content =
            data.candidates[0]?.content?.parts[0]?.text || '';
          modelUsed = config.model;
          // Google doesn't always return token counts in the same format
          promptTokens = data.usageMetadata?.promptTokenCount || 0;
          completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
          break;
      }

      return {
        content,
        model: modelUsed,
        provider: 'api',
        tokens: { prompt: promptTokens, completion: completionTokens },
      };
    } catch (error) {
      console.error('API generation failed:', error);
      throw error;
    }
  }

  async generateStreamingResponse(
    prompt: string,
    systemPrompt: string = '',
    options: AIServiceOptions = {},
    onToken: (token: string) => void,
    onComplete: (response: AIServiceResponse) => void,
    onError: (error: Error) => void
  ) {
    const { temperature = 0.7 } = options;

    // Check if we should use offline mode
    const isOnline = await this.isOnline();
    const ollamaAvailable = await this.isOllamaAvailable();

    // Prefer Ollama when offline
    if (!isOnline || (ollamaAvailable && !this.currentApiConfig)) {
      this.ollama.generateStreamingResponse(
        'qwen3:4b',
        prompt,
        systemPrompt,
        temperature,
        onToken,
        (ollamaResponse) => {
          onComplete({
            content: ollamaResponse.response,
            model: ollamaResponse.model,
            provider: 'ollama',
            tokens: {
              prompt: ollamaResponse.prompt_eval_count || 0,
              completion: ollamaResponse.eval_count || 0,
            },
          });
        },
        onError
      );
      return;
    }

    // For API streaming, we'd implement similar logic per provider
    // For now, fall back to non-streaming if API is selected
    if (isOnline && this.currentApiConfig) {
      try {
        const response = await this.generateApiResponse(
          prompt,
          systemPrompt,
          options
        );
        onComplete(response);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      return;
    }

    // Last resort: try Ollama
    if (ollamaAvailable) {
      this.ollama.generateStreamingResponse(
        'qwen3:4b',
        prompt,
        systemPrompt,
        temperature,
        onToken,
        (ollamaResponse) => {
          onComplete({
            content: ollamaResponse.response,
            model: ollamaResponse.model,
            provider: 'ollama',
            tokens: {
              prompt: ollamaResponse.prompt_eval_count || 0,
              completion: ollamaResponse.eval_count || 0,
            },
          });
        },
        onError
      );
      return;
    }

    onError(
      new Error(
        'No AI service available. Check your internet connection or start Ollama.'
      )
    );
  }
}

// Export singleton instance
export const aiService = new AIService();