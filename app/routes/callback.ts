import { auth } from "~/.server";
import type { Route } from "./+types/callback";
import { redirect } from "react-router";

export let loader = async ({ request }: Route.LoaderArgs) => {
  await auth.authenticate(request);

  return redirect("/");
};
