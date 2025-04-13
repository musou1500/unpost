import { db } from "~/.server/db";
import type { Route } from "./+types/route";
import type * as s from "~/board";

export const action = async ({ params, request }: Route.ActionArgs) => {
  const { action } = await request.json();
  await db.addAction(
    `${params.y}.${params.m}.${params.d}`,
    action as s.Actions
  );

  return null;
};
