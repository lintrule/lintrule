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

export async function login(props: {
  accessToken?: string;
  loginHost?: string;
}) {
  // Make a challenge request
  const challengeResponse = await fetch(`${props.loginHost}/api/challenge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: props.accessToken,
    }),
  });

  const challenge = (await challengeResponse.json()) as CompleteResponse;

  // If the initial challenge is not incomplete, that's somewhat unexpected
  // so we should throw an error
  if (challenge.status !== "incomplete") {
    throw new Error(`Unexpected challenge status: ${challenge.status}`);
  }

  if (challenge.status === "complete") {
    //
  }
}
