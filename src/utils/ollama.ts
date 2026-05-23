import { ApiConfig } from '../components/ApiKeyManager';

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private baseUrl: string = 'http://localhost:11434';
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isAvailable = response.ok;
      return this.isAvailable;
    } catch (error) {
      console.warn('Ollama service not available:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }
    
    if (!this.isAvailable) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models.map((model: any) => ({
        name: model.name,
        size: this.formatSize(model.size),
        modified: new Date(model.modified_at).toLocaleString(),
      }));
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async generateResponse(
    model: string,
    prompt: string,
    system?: string,
    temperature: number = 0.7
  ): Promise<OllamaGenerateResponse> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error('Ollama service is not available');
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
          temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        model: data.model,
        created_at: data.created_at,
        response: data.message?.content || '',
        done: true,
        prompt_eval_count: data.prompt_eval_count,
        eval_count: data.eval_count,
        total_duration: data.total_duration,
        load_duration: data.load_duration,
        prompt_eval_duration: data.prompt_eval_duration,
        eval_duration: data.eval_duration,
      };
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  async generateStreamingResponse(
    model: string,
    prompt: string,
    system: string | undefined,
    temperature: number,
    onToken: (token: string) => void,
    onComplete: (response: OllamaGenerateResponse) => void,
    onError: (error: Error) => void
  ) {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        onError(new Error('Ollama service is not available'));
        return;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
          temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        onError(new Error(`Ollama API error: ${response.status}`));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError(new Error('Unable to read response stream'));
        return;
      }

      let accumulatedResponse = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  onToken(parsed.message.content);
                  accumulatedResponse += parsed.message.content;
                }
                if (parsed.done) {
                  onComplete({
                    model: parsed.model,
                    created_at: parsed.created_at,
                    response: accumulatedResponse,
                    done: true,
                    context: parsed.context,
                    total_duration: parsed.total_duration,
                    load_duration: parsed.load_duration,
                    prompt_eval_count: parsed.prompt_eval_count,
                    prompt_eval_duration: parsed.prompt_eval_duration,
                    eval_count: parsed.eval_count,
                    eval_duration: parsed.eval_duration,
                  });
                  return;
                }
              } catch (e) {
                // Ignore parsing errors for individual lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  isAvailableNow(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();