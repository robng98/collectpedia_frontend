export type User = {
    email: string;
    userName?: string;
    fullName?: string;
    token?: string;
    name?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
}