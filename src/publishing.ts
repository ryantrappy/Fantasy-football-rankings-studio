import type { WeeklyRanking } from './types';
export interface PublicationStatus {
  publicId: string;
  publishedAt: string;
  revision: number;
}
export interface PublishedEdition {
  status: PublicationStatus;
  ranking: WeeklyRanking;
}
export interface PublishingApi {
  status(id: string): Promise<PublicationStatus | null>;
  publish(id: string, revision: number): Promise<PublicationStatus>;
  unpublish(id: string): Promise<void>;
}
