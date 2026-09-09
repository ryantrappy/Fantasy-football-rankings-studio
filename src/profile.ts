export interface UserProfile {
  userId: string;
  name: string;
  nickname: string;
  email: string | null;
  emailVerified: boolean;
}
export type ProfileUpdate = Pick<UserProfile, 'name' | 'nickname'>;
export interface ProfileApi {
  getProfile(): Promise<UserProfile>;
  updateProfile(data: ProfileUpdate): Promise<UserProfile>;
}
