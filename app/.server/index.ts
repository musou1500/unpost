import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { Authenticator } from "./auth";
import { config } from "./config";
import { sessionStorage } from "./session";
import { ActionStore } from "./action";

const prisma = new PrismaClient();
export const auth = new Authenticator(prisma, sessionStorage, config);
export const actionStore = new ActionStore(path.join(process.cwd(), "data"));
