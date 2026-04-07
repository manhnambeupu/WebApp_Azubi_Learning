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
var FacebookStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_facebook_1 = require("passport-facebook");
let FacebookStrategy = FacebookStrategy_1 = class FacebookStrategy extends (0, passport_1.PassportStrategy)(passport_facebook_1.Strategy, 'facebook') {
    constructor() {
        const isProduction = process.env.NODE_ENV === 'production';
        let clientID = process.env.FACEBOOK_APP_ID ?? '';
        let clientSecret = process.env.FACEBOOK_APP_SECRET ?? '';
        let callbackURL = process.env.FACEBOOK_CALLBACK_URL ?? '';
        if (!clientID || !clientSecret || !callbackURL) {
            if (isProduction) {
                throw new Error('Facebook OAuth configuration is missing');
            }
            clientID = 'mock_facebook_id';
            clientSecret = 'mock_facebook_secret';
            callbackURL = 'http://localhost:3001/api/auth/facebook/callback';
            if (process.env.NODE_ENV !== 'test') {
                common_1.Logger.warn('Facebook OAuth env is missing. Using local mock config for development.', FacebookStrategy_1.name);
            }
        }
        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email'],
            profileFields: ['id', 'emails', 'name', 'displayName'],
        });
    }
    validate(_accessToken, _refreshToken, profile, done) {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            done(new Error('Facebook account email is missing'));
            return;
        }
        const fullName = profile.displayName ||
            [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
            'Facebook User';
        done(null, {
            email,
            fullName,
            provider: 'facebook',
            providerId: profile.id,
        });
    }
};
exports.FacebookStrategy = FacebookStrategy;
exports.FacebookStrategy = FacebookStrategy = FacebookStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FacebookStrategy);
//# sourceMappingURL=facebook.strategy.js.map