export interface User {
  usename: string;
  displayName: string;
  token: string;
  image?: string;
}

export interface UserFormValues {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
}