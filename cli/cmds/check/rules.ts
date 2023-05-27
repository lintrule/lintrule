// document_rule.ts
export interface DocumentRule {
  document: string;
  rule: string;
}

export interface DocumentRuleResponse {
  object: "check_response";
  pass: boolean;
  skipped?: {
    reason: "context_too_big";
  };
  message?: string;
}

export interface ErrorResponse {
  object: "error";
  type: string;
  message: string;
}

export async function sendRule({
  url,
  accessToken,
  documentRule,
  retries = 1,
}: {
  url: string;
  accessToken: string;
  documentRule: DocumentRule;
  retries: number;
}): Promise<DocumentRuleResponse> {
  // Create a headers object with the content type
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", `Bearer ${accessToken}`);

  // Send the POST request to the given URL with document and rule as parameters
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(documentRule),
  });

  if (res.status === 401) {
    throw new Error(
      "Your access token is unauthorized! Consider logging in again or using a different secret."
    );
  }

  // Payment required
  if (res.status === 402) {
    throw new Error(
      "Please setup your billing details! Please run `rules login` to setup your billing details."
    );
  }

  // Check for 'context_too_big'
  if (res.status === 400) {
    const body = await res.json();

    if (body.type === "context_too_big") {
      return {
        object: "check_response",
        pass: false,
        skipped: {
          reason: "context_too_big",
        },
      };
    }
  }

  if (retries > 0) {
    if (res.status >= 500 || res.status === 429) {
      // retry after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return sendRule({
        url,
        accessToken,
        documentRule,
        retries: retries - 1,
      });
    }
  }

  // Check if the response is ok
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  // Read the response body into a DocumentRuleResponse object
  const body: DocumentRuleResponse = await res.json();

  return {
    ...body,
  };
}

export async function check({
  document,
  host,
  rule,
  accessToken,
}: {
  host: string;
  document: string;
  rule: string;
  accessToken: string;
}): Promise<DocumentRuleResponse> {
  // Remove the frontmatter in the rule
  rule = rule.replace(/---[\s\S]*---/, "");

  const body = await sendRule({
    url: `${host}/api/check`,
    accessToken,
    documentRule: {
      document: document,
      rule: rule.trim(),
    },
    retries: 2,
  });

  return body;
}
