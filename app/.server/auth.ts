import * as client from "openid-client";
import { redirect } from "react-router";
import type { SessionStorage } from "./session";
import type { PrismaClient } from "@prisma/client";
import { type Config } from "./config";
import { findUserById, upsertUser, type User } from "./db";

const issuer = new URL("https://accounts.google.com");

export class Authenticator {
  constructor(
    private prisma: PrismaClient,
    private sessionStorage: SessionStorage,
    private config: Config
  ) {}

  private getConfig(): Promise<client.Configuration> {
    return client.discovery(
      issuer,
      this.config.auth.clientId,
      this.config.auth.clientSecret
    );
  }

  async getUser(request: Request): Promise<User | null> {
    const session = await this.sessionStorage.getSession(
      request.headers.get("Cookie")
    );

    const userId = session.get("userId");
    if (userId !== undefined) {
      const user = await findUserById(this.prisma, userId);
      if (user !== null) {
        return user;
      }
    }

    return null;
  }

  async authenticate(request: Request): Promise<User> {
    const sessionUser = await this.getUser(request);
    if (sessionUser !== null) {
      return sessionUser;
    }

    const session = await this.sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    const oidcSession = session.get("oidc");
    const stateUrl = new URL(request.url).searchParams.get("state");
    if (stateUrl === null || oidcSession === undefined) {
      throw await this.redirect(request);
    }

    const reqUrl = new URL(request.url);
    const tokens = await client.authorizationCodeGrant(
      await this.getConfig(),
      // TODO: trust proxyの設定をする
      new URL(`${reqUrl.pathname}${reqUrl.search}`, this.config.baseUrl),
      {
        pkceCodeVerifier: oidcSession.codeVerifier,
        idTokenExpected: true,
        expectedState: oidcSession.state,
      }
    );

    const claims = tokens.claims();
    if (claims === undefined || typeof claims.name !== "string") {
      throw new Error("invalid claims");
    }

    const user = await upsertUser(this.prisma, {
      name: claims.name,
      googleAccountId: claims.sub,
    });

    session.unset("oidc");
    session.set("userId", user.id);
    throw redirect(oidcSession.nextUrl, {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session),
      },
    });
  }

  async logout(request: Request, redirectUrl: string): Promise<never> {
    const session = await this.sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    throw redirect(redirectUrl, {
      headers: {
        "Set-Cookie": await this.sessionStorage.destroySession(session),
      },
    });
  }

  private async redirect(
    request: Request,
    scopes: string[] = ["openid", "email", "profile"]
  ): Promise<Response> {
    const config = await this.getConfig();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();

    const url = client
      .buildAuthorizationUrl(config, {
        redirect_uri: new URL("/callback", this.config.baseUrl).toString(),
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        scope: scopes.join(" "),
        state,
        prompt: "consent",
      })
      .toString();

    const session = await this.sessionStorage.getSession(
      request.headers.get("Cookie")
    );

    // TODO: trust proxyの設定をする
    const reqUrl = new URL(request.url);
    const nextUrl = new URL(
      `${reqUrl.pathname}${reqUrl.search}`,
      this.config.baseUrl
    );
    session.set("oidc", {
      codeVerifier,
      state,
      nextUrl: nextUrl.toString(),
    });
    session.unset("userId");

    throw redirect(url, {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session),
      },
    });
  }
}
