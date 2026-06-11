import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { prisma } from "./prisma"
import { compare } from "bcryptjs"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub,
        Google({
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),

        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user || !user.passwordHash) return null

                const passwordMatch = await compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!passwordMatch) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            }
        })
    ],

    callbacks: {
        // This handles OAuth — creates user in DB if first login
        async signIn({ user, account }) {
            if (account?.provider === "google" || account?.provider === "github") {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! }
                    })
                    if (!existingUser) {
                        await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: user.name,
                                avatarUrl: user.image,
                            }
                        })
                    }
                } catch {
                    return false
                }
            }
            return true
        },

        // Retrieve latest user details from database to keep session fresh
        async jwt({ token, user }) {
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email! }
                })
                token.id = dbUser?.id
            }
            
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string }
                })
                if (dbUser) {
                    token.name = dbUser.name
                    token.email = dbUser.email
                }
            }
            return token
        },

        // Attach user id to session object
        async session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string
            }
            return session
        }
    },

    pages: {
        signIn: "/login",
    },
})