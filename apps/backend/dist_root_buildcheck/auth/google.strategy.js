"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
let GoogleStrategy = GoogleStrategy_1 = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    constructor() {
        const isProduction = process.env.NODE_ENV === 'production';
        let clientID = process.env.GOOGLE_CLIENT_ID ?? '';
        let clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
        let callbackURL = process.env.GOOGLE_CALLBACK_URL ?? '';
        if (!clientID || !clientSecret || !callbackURL) {
            if (isProduction) {
                throw new Error('Google OAuth configuration is missing');
            }
            clientID = 'mock_google_id';
            clientSecret = 'mock_google_secret';
            callbackURL = 'http://localhost:3001/api/auth/google/callback';
            if (process.env.NODE_ENV !== 'test') {
                common_1.Logger.warn('Google OAuth env is missing. Using local mock config for development.', GoogleStrategy_1.name);
            }
        }
        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
        });
    }
    validate(_accessToken, _refreshToken, profile, done) {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            done(new Error('Google account email is missing'));
            return;
        }
        const fullName = profile.displayName || 'Google User';
        done(null, {
            email,
            fullName,
            provider: 'google',
            providerId: profile.id,
        });
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = GoogleStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map