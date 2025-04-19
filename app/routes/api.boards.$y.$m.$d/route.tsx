import { actionStore } from "~/.server";
import type { Route } from "./+types/route";
import type * as s from "~/board";
import { auth } from "~/.server";

export const action = async ({ params, request }: Route.ActionArgs) => {
  await auth.authenticate(request);
  const { action } = await request.json();
  await actionStore.addAction(
    `${params.y}.${params.m}.${params.d}`,
    action as s.Actions
  );

  return null;
};
