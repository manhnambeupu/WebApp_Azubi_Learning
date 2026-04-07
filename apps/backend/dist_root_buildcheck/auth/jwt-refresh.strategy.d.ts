import { Strategy } from 'passport-jwt';
type JwtRefreshPayload = {
    userId: string;
};
declare const JwtRefreshStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor();
    validate(payload: JwtRefreshPayload): {
        userId: string;
    };
}
export {};
