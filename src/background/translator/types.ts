import type { TranslationResult, TranslatorName } from '../../shared/types';

export interface SourceConfig {
  [key: string]: string | undefined;
}

export interface TranslationSource {
  name: TranslatorName;
  translate(text: string, source: string, target: string, config: SourceConfig): Promise<TranslationResult>;
}

export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly code = 'UNKNOWN',
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}
