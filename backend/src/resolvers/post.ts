
import { Post } from './../entities/Post';
import { Resolver, Query, Ctx, Arg, Int, Mutation } from 'type-graphql';

import { MyContext } from './../types'

@Resolver()
export class PostResolver {
    // specify what our query returns (fn that returns type that query returns)
    @Query(() => [Post])
    posts(
        @Ctx() { em }: MyContext
    ) : Promise<Post[]> {
        return em.find(Post, {});
    }
    // nullable means it's possible that post with specified id doesn't exist.
    // in this case it will return null
    @Query(() => Post, { nullable: true })
    post(
        // this decorators are just functions that called in runtime.
        // they take parameter as target and fullfill/change it to use inside function body
        @Arg("_id", () => Int) _id: number,
        @Ctx() { em }: MyContext
        // post() returns promise that resolves to Post obj or null
    ) : Promise<Post | null> {
        return em.findOne(Post, { _id });
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: string,
        @Ctx() { em }: MyContext
    ) : Promise<Post> {
        const post = await em.create(Post, {title});
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg("_id", () => Int) _id: number,
        @Arg("title", () => String) title: string,
        @Ctx() { em }: MyContext
    ) : Promise<Post | null> {
        const post = await em.findOne(Post, {_id});
        if (!post) {
            return null;
        }
        if (typeof title !== 'undefined') {
            post.title = title;
            await em.persistAndFlush(post);
        }
        return post;
    }
    @Mutation(() => Boolean)
    async deletePost(
        @Arg("_id", () => Int) _id: number,
        @Ctx() { em }: MyContext
    ) : Promise<boolean> {
        try {
            await em.nativeDelete(Post, {_id});
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}