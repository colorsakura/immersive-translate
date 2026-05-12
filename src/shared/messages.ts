import type { TranslationResult } from './types';

export interface TranslateRequestMessage {
  type: 'translate';
  text: string;
}

export interface TranslateSuccessResponse {
  ok: true;
  result: TranslationResult;
}

export interface TranslateErrorResponse {
  ok: false;
  error: string;
}

export type RuntimeMessage = TranslateRequestMessage;
export type TranslateResponse = TranslateSuccessResponse | TranslateErrorResponse;
