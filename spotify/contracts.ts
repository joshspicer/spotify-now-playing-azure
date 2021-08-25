export interface AuthPayload {
    "access_token": string;
    "token_type": string,
    "expires_in": Date
}

export interface NowPlaying {
    artistName: string;
    isPlaying: boolean,
    response: string;
    songName: string;
}