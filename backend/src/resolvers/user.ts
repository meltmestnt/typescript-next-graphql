
import { User } from './../entities/User';
import { MyContext } from 'src/types';
import { Resolver, Query, Mutation, InputType, Field, Arg, Ctx, ObjectType } from 'type-graphql';

import argon2 from 'argon2';


function defaultError(message: string = 'something went wrong') : UserResponse {
    return {
        errors: [{
            field: null,
            message
        }]
    }
}

// specify our payload for registering user
@InputType()
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
}
// TODO: split this up

@ObjectType()
class FieldError {
    @Field(() => String, { nullable: true })
    field: string | null

    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        try {
            // you are not logged in
            if (!req.session.userId) {
                return null;
            }

            const user = await em.findOne(User, { _id: req.session.userId });
            return user;
        } catch (error) {
            console.error(error);
            return defaultError('error finding user with specified id')
        }
    }
    // specify what our query returns (fn that returns type that query returns)
    @Mutation(() => UserResponse)
    async register(
        @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [{
                    field: 'username',
                    message: "username is not specified (length must be greater than 2)"
                }]
            }
        }
        if (options.password.length <= 3) {
            return {
                errors: [{
                    field: 'password',
                    message: "password is not specified (length must be greater than 3)"
                }]
            }
        }
        // we won't write user password to database. Instead we will hash it
        try {
            const hashedPassword = await argon2.hash(options.password);
            const user = em.create(User, { username: options.username, password: hashedPassword });
            await em.persistAndFlush(user);
            // store user id session; this will set a cookie on the user and log in
            req.session.userId = user._id;
            return {
                user
            };
        } catch (error) {
            console.error('ERROR REGISTERING USER!', error);
            if (error.code === '23505' || error.detail.includes('already exists')) {
                return {
                    errors: [{field: 'username', message: 'user already exists'}]
                }
            }
            return {
                errors: [{field: 'username', message: error?.message}]
            };
        }
    }
    @Mutation(() => UserResponse)
    async login(
        @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username });
        if (!user) {
            return {
                errors: [{field: 'username', message: 'that username does not exist'}]
            }
        }
        const valid = await argon2.verify(user.password, options.password);
        if (!valid) {
            return {
                errors: [{field: 'password', message: 'incorrect password'}]
            }
        }

        // create and store unique user session to authenticate them on other request

        req.session!.userId = user._id;
        // we actually could store whole user object in session
        // req.session.user = user;
        // but properties on user object can change so it's better to just look it up by id

        return {
            user
        }
    }
}