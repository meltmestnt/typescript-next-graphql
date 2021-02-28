import { __prod__ } from "./constants";
import { Post } from "./entities/Post";

import { MikroORM } from '@mikro-orm/core';
import path from 'path';
import { User } from "./entities/User";
export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    dbName: "test",
    debug: !__prod__,
    type: 'postgresql',
    entities: [Post, User],
/*         user: '',
    password: '' */
    // HERE WE GOT A TYPE THAT FUNCTION MikroORM.init EXPECTS AS ITS FIRST PARAMETER. parameters rerturns an array so we grab first item
    // So basically we tell typescript that this object we are exporting is the same type as MikroORM.init first parameter
} as Parameters<typeof MikroORM.init>[0];
// alternative as const; (but we can't see all properties MikroORM.init expects in its first parameter (obj))
