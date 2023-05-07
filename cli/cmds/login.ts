import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { writeConfig } from "../config.ts";

export interface CompleteResponse {
  object: "challenge";
  challenge: string;
  status: "complete" | "incomplete" | "expired";
  access_token?: string;
}

export interface ChallengeExpiredResponse {
  object: "error";
  type: "challenge_expired";
  message: string;
}

export interface ChallengeIsAccessedResponse {
  object: "error";
  type: "challenge_is_accessed";
  message: string;
}

export interface ChallengeUnauthorizedResponse {
  object: "error";
  type: "challenge_unauthorized";
  message: string;
}

type Responses =
  | CompleteResponse
  | ChallengeExpiredResponse
  | ChallengeIsAccessedResponse
  | ChallengeUnauthorizedResponse;

async function openBrowser(url: string) {
  let cmd: string[] = [];
  switch (Deno.build.os) {
    case "windows":
      cmd = ["cmd", "/c", "start", url];
      break;
    case "darwin":
      cmd = ["open", url];
      break;
    case "linux":
      cmd = ["xdg-open", url];
      break;
    default:
      return;
  }
  const process = Deno.run({ cmd });
  await process.status();
  process.close();
}

async function completeChallenge(props: {
  loginHost: string;
  challenge: string;
}) {
  // Make a challenge request
  const challengeResponse = await fetch(
    `${props.loginHost}/api/challenges/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challenge: props.challenge,
      }),
    }
  );

  const result = (await challengeResponse.json()) as Responses;
  if (result.object === "error") {
    switch (result.type) {
      case "challenge_expired":
        throw new Error("Login expired, please try again");
      case "challenge_is_accessed":
        throw new Error("Please try logging in again");
      case "challenge_unauthorized":
        throw new Error("Challenge unauthorized, please try again hacker");
    }
  }

  return result;
}

export async function login(props: {
  accessToken?: string;
  loginHost: string;
}) {
  // Make a challenge request
  const challengeResponse = await fetch(`${props.loginHost}/api/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!challengeResponse.ok) {
    throw new Error(
      `Unexpected response from challenge request: ${challengeResponse.status}`
    );
  }

  const challenge = (await challengeResponse.json()) as CompleteResponse;

  // If the initial challenge is not incomplete, that's somewhat unexpected
  // so we should throw an error
  if (challenge.status !== "incomplete") {
    throw new Error(`Unexpected challenge status: ${challenge.status}`);
  }

  // Open the challenge url in the browser
  const challengeUrl = `${props.loginHost}/auth/cli?challenge=${challenge.challenge}`;
  await openBrowser(challengeUrl);

  console.log(
    "If your browser does not open automatically, click here:",
    challengeUrl
  );

  // Poll the challenge endpoint until it's complete

  while (true) {
    const result = await completeChallenge({
      loginHost: props.loginHost,
      challenge: challenge.challenge,
    });

    if (result.status === "incomplete") {
      // Wait a little bit and try again
      await new Promise((resolve) => setTimeout(resolve, 200));
    } else if (result.status === "complete") {
      // Store the access token and exit
      await writeConfig({ accessToken: result.access_token });
      console.log(colors.bgGreen(" You're logged in! "));
      Deno.exit(0);
    }
  }
}
