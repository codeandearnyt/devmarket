import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * Everything that mutates or reads the back office.
 *
 * Keyed off `ctx.adminUser` — the operator proven by the dedicated admin
 * cookie — rather than `ctx.user`. The storefront session is intentionally
 * irrelevant here: signing in with Google, even from an account that happens
 * to hold role=admin, does not open the console. Inside an admin call we swap
 * `ctx.user` for the operator so existing handlers keep using `ctx.user.id`
 * for audit trails and storage paths without needing to know which cookie won.
 */
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.adminUser || ctx.adminUser.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.adminUser,
        adminUser: ctx.adminUser,
      },
    });
  }),
);
