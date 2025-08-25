export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    user_name?: string;
    preferred_username?: string;
    login?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}