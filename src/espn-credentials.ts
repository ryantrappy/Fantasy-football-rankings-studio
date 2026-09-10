export interface EspnCredentials {
  espnS2: string;
  swid: string;
}
export interface EspnCredentialStatus {
  configured: boolean;
  onboardingComplete: boolean;
}
export interface EspnCredentialsApi {
  getEspnCredentialStatus: () => Promise<EspnCredentialStatus>;
  saveEspnCredentials: (input: EspnCredentials) => Promise<EspnCredentialStatus>;
  removeEspnCredentials: () => Promise<EspnCredentialStatus>;
  skipEspnSetup: () => Promise<EspnCredentialStatus>;
}
