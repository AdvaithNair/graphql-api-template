// Resolvers
//import RegisterResolver from "./modules/user/RegisterResolver";
import UserResolver from "./modules/user/UserResolver";

// Secretive Files
import { SESSION_SECRET, SESSION_AGE, FRONTEND_URL } from "./secrets";

// Standard Imports
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import "reflect-metadata";
import session from "express-session";
import connectRedis from "connect-redis";
import redis from "./redis";
import cors from "cors";

// Localhost Port Number
const PORT: number = 4000;

const main = async () => {
  // Connect to DB
  await createConnection();

  // GraphQL Schema
  const schema = await buildSchema({
    resolvers: [UserResolver]
  });

  // Initialize Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }: any) => ({ req })
  });

  // Create Express Instance
  const app = express();

  // Create Redis Store
  const RedisStore = connectRedis(session);

  // Applies Redis Middleware to Express App
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

  // Applies CORS to Express App
  app.use(
    cors({
      credentials: true,
      origin: FRONTEND_URL
    })
  );

  // Applies Apollo Server Middleware to Express App
  apolloServer.applyMiddleware({ app });

  // Create Server
  app.listen(PORT, () =>
    console.log(`Server Running on http://localhost:${PORT}/graphql...`)
  );
};

main();
