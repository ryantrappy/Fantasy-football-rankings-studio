import type { WritingProvider } from './writing';

export interface AiCredentialStatus {
  codexConfigured: boolean;
  claudeConfigured: boolean;
}

export interface AiCredentialsApi {
  getAiCredentialStatus(): Promise<AiCredentialStatus>;
  saveAiCredential(input: {
    provider: WritingProvider;
    apiKey: string;
  }): Promise<AiCredentialStatus>;
  removeAiCredential(provider: WritingProvider): Promise<AiCredentialStatus>;
}
