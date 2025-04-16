import type { Route } from "./+types/route";
import * as crypto from "crypto";
import * as path from "path";
import { writeFile } from "fs/promises";
import { config } from "~/.server/config";

export const action = async ({ request }: Route.ActionArgs) => {
  const fd = await request.formData();
  const file = fd.get("file");

  if (!(file instanceof File)) {
    throw new Response("Invalid file", { status: 400 });
  }

  const hash = crypto
    .createHash("sha256")
    .update(await file.bytes())
    .digest("hex");

  await writeFile(path.join(config.uploads.dir, hash), await file.bytes());

  return {
    url: `${config.baseUrl}/uploads/${hash}`,
  };
};
