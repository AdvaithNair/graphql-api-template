import { GOOGLE_APP, PORT } from "../secrets";
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const GoogleAuth = new GoogleStrategy(
  {
    clientID: GOOGLE_APP.ID,
    clientSecret: GOOGLE_APP.SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`,
    passReqToCallback: true
  },
  (request: any, _accessToken: string, _refreshToken: any, profile: any, done: any) => {
    console.log("Request: " + request);
    console.log(profile);
    return done(null, profile);
  }
);

export default GoogleAuth;
