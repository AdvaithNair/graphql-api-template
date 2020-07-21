import {
  PORT,
  SESSION_SECRET,
  SESSION_AGE,
  FRONTEND_URL,
  FACEBOOK_OAUTH_SCOPES
} from "./secrets";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import session from "express-session";
import connectRedis from "connect-redis";
import redis from "./redis";
import cors from "cors";
import "reflect-metadata";
import { graphqlUploadExpress } from "graphql-upload";
import passport from "passport";
import FacebookAuth from "./oauth/FacebookStrategy";
import {createFacebookUser, createGoogleUser} from "./oauth/CreateUserOAuth";
import GoogleAuth from "./oauth/GoogleStrategy";

const main = async () => {
  // Connect to DB
  await createConnection();

  // GraphQL Schema
  const schema = await buildSchema({
    resolvers: [__dirname + "/modules/**/*.ts"]
  });

  // Initialize Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
    uploads: false
  });

  // Create Express Instance
  const app = express();

  // Initialize Facebook OAuth Strategy
  passport.use(FacebookAuth);

  // Initialize Google OAuth Strategy
  passport.use(GoogleAuth);

  // Adjusts Passport Settings
  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  // Passport Middleware
  app.use(passport.initialize());

  // Create Redis Store
  const RedisStore = connectRedis(session);

  // Applies Session and Redis Middleware to Express App
  app.use(
    session({
      store: new RedisStore({
        client: redis as any
      }),
      name: "qid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_AGE
      }
    })
  );

  // Tester Route
  app.get("/hi", (_req, res) => {
    res.send("nice");
  });

  // Facebook OAuth Routes
  app.get(
    "/auth/facebook",
    passport.authenticate("facebook", { scope: FACEBOOK_OAUTH_SCOPES })
  );
  app.get("/auth/facebook/callback", (req, res, next) => {
    passport.authenticate("facebook", async (_err, user, _info) => {
      req.session!.userId = await createFacebookUser(req, user);
      res.redirect("/graphql");
    })(req, res, next);
  });

  // Google OAuth Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ]
    })
  );
  app.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", async (_err, user, _info) => {
      req.session!.userId = await createGoogleUser(req, user);
      res.redirect("http://advaithnair.com");
    })(req, res, next);
  });

  // Applies GraphQL Upload Middleware to App
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // Applies CORS to Express App
  app.use(
    cors({
      credentials: true,
      origin: FRONTEND_URL
    })
  );

  // Allows Local Images to be Accessed
  app.use(express.static("images"));

  // Applies Apollo Server Middleware to Express App
  apolloServer.applyMiddleware({ app });

  // Create Server
  app.listen(PORT, () =>
    console.log(`Server Running on http://localhost:${PORT}/graphql...`)
  );
};

main();
