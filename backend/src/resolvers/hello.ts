
import { Resolver, Query } from 'type-graphql';

@Resolver()
export class HelloResolver {
    // specify what our query returns (fn that returns type that query returns)
    @Query(() => String)
    hello() {
        return "hello world"
    }
}