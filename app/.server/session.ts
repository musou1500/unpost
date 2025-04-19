import {
  createCookieSessionStorage,
  type SessionStorage as RRSessionStorage,
  type Session as RRSession,
} from "react-router";
import { config } from "./config";

type SessionData = {
  oidc: {
    codeVerifier: string;
    state: string;
    nextUrl: string;
  };
  userId: string;
};

export const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.secret],
    secure: config.nodeEnv === "production",
  },
});

export type SessionStorage = RRSessionStorage<SessionData>;
export type Session = RRSession<SessionData>;
