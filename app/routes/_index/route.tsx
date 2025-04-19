import { redirect } from "react-router";
import type { Route } from "./+types/route";
import { auth } from "~/.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await auth.authenticate(request);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return redirect(`/boards/${y}/${m}/${d}`);
};
