import "reflect-metadata";

import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants";

import mikroConfig from './mikro-orm.config';

import express, { Request, Response } from 'express';

import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql'
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
// redis is used as a database to store user sessions (authentication) (this is temporary)
import redis from 'redis';
// creates sessions for authenticated users
import session from 'express-session';
// provides Redis session storage for Express.
import connectRedis from 'connect-redis';
import { MyContext } from "./types";


const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    
    // automatically run migrations
    await orm.getMigrator().up();
    
    const app = express();
    const { PORT = 4000 } = process.env;
    
    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    // adding session middleware to our express routes
    app.use(
      session({
          // name of the cookie on frontend
        name: "qid",
        store: new RedisStore({ client: redisClient,
            // this params make sessions last forever ( so no need to update them when user does something )
            disableTouch: true,
            // ttl is time to session expiry
            disableTTL: true
        }),
        cookie: {
            // expired in 10 years
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            // this param makes it impossible to access this cookie on frontend
            httpOnly: true,
            sameSite: "lax", // csrf
            secure: __prod__ // cookie only works in https
        },
        // TODO: hide this to env variable (.env) file that will not be pushed to github so the secret key will be save (probably)
        secret: "test_secret_key",
        resave: false,
        saveUninitialized: false,
      })
    )
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }) : MyContext => ({ em: orm.em, req, res })
    })

    apolloServer.applyMiddleware({ app, cors: false })

    app.get('/', (req, res) => {
        res.send("hello")
    })

    app.listen(PORT, () => {
        console.log(`server started on localhost:${PORT}`);
    })
    /* const post = orm.em.create(Post, {
        title: 'my first post'
    });
    await orm.em.persistAndFlush(post); */
}


main().catch(console.error);