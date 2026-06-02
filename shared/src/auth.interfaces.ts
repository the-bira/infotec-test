export interface ILoginDto {
  nickname: string;
  password?: string;
}

export interface ILoginResponse {
  access_token: string;
}
