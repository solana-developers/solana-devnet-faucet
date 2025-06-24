// import { Session, getServerSession } from "next-auth";
// import { authOptions } from "./options";

// export async function getUserSession() {
//   return getServerSession(authOptions);
// }

// export type BaseSessionHandlerArgs = {
//   req: Request;
//   params?: Record<string, string>;
//   searchParams?: Record<string, string>;
//   session: Session | null;
// };

// /**
//  * Request handler with an OPTIONAL user session
//  */
// export type WithOptionalSessionHandler = {
//   ({
//     req,
//     params,
//     searchParams,
//     session,
//   }: BaseSessionHandlerArgs): Promise<Response>;
// };

// /**
//  * Request handler with a REQUIRED user session
//  */
// export type WithRequiredSessionHandler = {
//   ({
//     req,
//     params,
//     searchParams,
//     session,
//   }: BaseSessionHandlerArgs & {
//     session: NonNullable<Session>;
//   }): Promise<Response>;
// };

// /**
//  * Wrapper handler function to add a user's current session into requests
//  */
// export const withOptionalUserSession =
//   (handler: WithOptionalSessionHandler) =>
//   async (req: Request, { params }: { params?: Record<string, string> }) => {
//     const session = await getUserSession();
//     return handler({ req, params, session });
//   };

// /**
//  * Wrapper handler function to ensure requests are required to have a current session
//  */
// export const withRequiredUserSession =
//   (handler: WithRequiredSessionHandler) =>
//   async (req: Request, { params }: { params?: Record<string, string> }) => {
//     const session = await getUserSession();
//     if (!session?.user.id) {
//       return new Response("Unauthorized: Login required.", { status: 401 });
//     }
//     return handler({ req, params, session });
//   };
