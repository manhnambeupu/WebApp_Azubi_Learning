import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
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
        Logger.warn(
          'Google OAuth env is missing. Using local mock config for development.',
          GoogleStrategy.name,
        );
      }
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
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
}
