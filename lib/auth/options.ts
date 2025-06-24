// import { NextAuthOptions } from "next-auth";
// import { GithubProfile } from "next-auth/providers/github";
// import GitHubProvider from "next-auth/providers/github";
// import { SITE } from "@/lib/constants";

// const IS_VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

// // define a list of accepted auth providers
// export const authOptions: NextAuthOptions = {
//   providers: [
//     GitHubProvider({
//       clientId: process.env.GITHUB_CLIENT_ID!,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//       profile(profile) {
//         return {
//           ...profile,
//           createdAt: profile.created_at,
//         };
//       },
//     }),
//     // Twitter({
//     //   clientId: process.env.TWITTER_CLIENT_ID,
//     //   clientSecret: process.env.TWITTER_CLIENT_SECRET,
//     //   version: "2.0",
//     // }),
//   ],
//   pages: {
//     signIn: "/?signin",
//     newUser: "/?new",
//     signOut: "/?signout",
//     error: "/?error", // Error code passed in query string as ?error=
//     // verifyRequest: '/auth/verify-request', // (used for check email message)
//   },
//   session: { strategy: "jwt" },
//   cookies: {
//     sessionToken: {
//       name: `${IS_VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
//       options: {
//         httpOnly: true,
//         sameSite: "lax",
//         path: "/",
//         // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
//         domain: IS_VERCEL_DEPLOYMENT
//           ? process.env.VERCEL_ENV == "production"
//             ? `.${SITE.domain}`
//             : `.${process.env.VERCEL_BRANCH_URL}`
//           : undefined,
//         secure: IS_VERCEL_DEPLOYMENT,
//       },
//     },
//   },
//   callbacks: {
//     /**
//      * control if the `user` is actually allowed to signin
//      * (i.e. blacklisting, wait-listed, etc)
//      */
//     signIn: async ({ user, account, credentials, email, profile }) => {
//       // console.debug("[/api/auth]", "signIn callback");

//       // TODO: add ability to blacklist accounts, preventing them from signing in
//       // const BLACKLISTED_EMAILS = await getBlackListedEmails();
//       // if (BLACKLISTED_EMAILS.has(user.email)) {
//       // 	return false;
//       // }

//       // return `true` to allow the user to sign in
//       return true;
//     },
//     /**
//      * craft payload returned to the client in the session requests (i.e. `getServerSession`)
//      */
//     jwt: async ({ token, account, user, profile }) => {
//       // TODO: add ability to blacklist accounts, preventing them from continuing to be authorized
//       // const BLACKLISTED_EMAILS = await getBlackListedEmails();
//       // if (BLACKLISTED_EMAILS.has(token.email)) {
//       // 	return {};
//       // }

//       // add the user specific details into the jwt
//       if (user) {
//         // note: update the `next-auth.d.ts` add more fields
//         token.id = user.id;
//         token.picture = user.image;
//         token.email = user.email;
//         token.name = user.name;
//         token.username = user.username;
//       }

//       // store the desired github user info in the user's session token
//       if (account?.provider == "github" && !!profile) {
//         const githubProfile = profile as GithubProfile;
//         token.githubUsername = githubProfile.login;
//         token.githubUserId = githubProfile.id.toString();
//         token.accessToken = account.access_token;
//         token.createdAt = githubProfile.createdAt;
//         if (!token.username) token.username = githubProfile.login;
//       }

//       return token;
//     },
//     /**
//      * handler for all the session checking actions
//      * note: we can return custom data here if desired
//      */
//     session: async ({ session, token }) => {
//       console.debug("[/api/auth]", "fetch session");

//       // console.debug("[session]", session);
//       // console.debug("[token]", token);
//       // console.debug("[user]", user);

//       // @ts-expect-error
//       session.user = token;

//       /**
//        * note: add any extra data into the session that is desired here
//        * or validate the current session data and update as desired from the db
//        */

//       // console.debug("session:", session);
//       return session;
//     },
//   },
//   events: {
//     /** fire an event on each successful sign in request (i.e. send an email) */
//     async signIn({ user, account, isNewUser }) {
//       console.debug("[api/auth] signIn event");

//       /**
//        * todo: handle creating a new Team and TeamMember relationship for newly created users
//        * (e.g. for email sign in)
//        */
//       // handle a new User record being created
//       // if (isNewUser) {
//       //   console.debug("[new user]", user);

//       //   // create a new team with this newly created user as the admin
//       //   const team = await createTeamWithMember({
//       //     team: {
//       //       label: "Personal",
//       //     },
//       //     user: user as User,
//       //   });

//       // // ensure the new Team record/relationship was created
//       //   if (!team) console.warn(`  "createTeamWithMember" failed`);
//     },
//   },
// };
//
