/**
 * Shared types for the AgenticEmail extension
 */

export interface TimingInfo {
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}

export interface FormState {
  prompt: string;
  tone: string;
  charLimit: string;
}

export interface StorageResponse {
  data?: {
    response: string;
  };
  response: string;
  error?: string;
  timestamp: number;
  isLoading?: boolean;
  timing?: TimingInfo;
  formState?: FormState;
}

export interface EmailGenerationPayload {
  action_instruction: string;
  email: string;
  tone: string;
  char_limit: number;
}

export const STORAGE_KEY = 'agenticEmailResponse';
