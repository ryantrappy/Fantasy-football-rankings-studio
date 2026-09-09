export type WritingProvider = 'codex' | 'claude';
export interface WritingSelection {
  leagueId: string;
  year: number;
  week: number;
  teamId: string;
}
export interface WritingContext {
  teamName: string;
  year: number;
  throughWeek: number;
  facts: string[];
  depth: string[];
  notes: string[];
}
export interface WritingProviderOption {
  id: WritingProvider;
  installed: boolean;
  enabled: boolean;
}
export interface WritingApi {
  context(selection: WritingSelection): Promise<WritingContext>;
  providers(): Promise<WritingProviderOption[]>;
  generate(
    selection: WritingSelection & { provider: WritingProvider; model: string; approved: boolean },
  ): Promise<string>;
}
