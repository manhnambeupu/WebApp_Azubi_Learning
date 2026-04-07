import { Profile, Strategy } from 'passport-facebook';
type DoneCallback = (error: Error | null, user?: Record<string, string>) => void;
declare const FacebookStrategy_base: new (...args: [options: import("passport-facebook").StrategyOptionsWithRequest] | [options: import("passport-facebook").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class FacebookStrategy extends FacebookStrategy_base {
    constructor();
    validate(_accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback): void;
}
export {};
