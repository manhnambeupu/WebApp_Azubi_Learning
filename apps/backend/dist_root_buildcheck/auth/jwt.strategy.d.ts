import { Strategy } from 'passport-jwt';
import { JwtAccessPayload } from './auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtAccessPayload): {
        userId: string;
        role: JwtAccessPayload['role'];
    };
}
export {};
