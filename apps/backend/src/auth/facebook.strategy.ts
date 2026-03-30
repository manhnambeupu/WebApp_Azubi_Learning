import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

type DoneCallback = (error: Error | null, user?: Record<string, string>) => void;

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const callbackURL = process.env.FACEBOOK_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Facebook OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'displayName'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: DoneCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Facebook account email is missing'));
      return;
    }

    const fullName =
      profile.displayName ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
      'Facebook User';

    done(null, {
      email,
      fullName,
      provider: 'facebook',
      providerId: profile.id,
    });
  }
}
