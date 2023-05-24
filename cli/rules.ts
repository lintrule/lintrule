// document_rule.ts
export interface DocumentRule {
  document: string;
  rule: string;
}

export interface DocumentRuleResponse {
  pass: boolean;
  message?: string;
}

async function sendRule({
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
    throw new Error("Please setup your billing details!");
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

  return body;
}

export async function check({
  change,
  host,
  rulePath,
  accessToken,
}: {
  host: string;
  change: {
    file: string;
    snippet: string;
  };
  rulePath: string;
  accessToken: string;
}): Promise<DocumentRuleResponse> {
  // Read the rule
  let rule = await Deno.readTextFile(rulePath);

  // Remove the frontmatter in the rule
  rule = rule.replace(/---[\s\S]*---/, "");

  const body = await sendRule({
    url: `${host}/api/check`,
    accessToken,
    documentRule: {
      document: change.snippet,
      rule: rule.trim(),
    },
    retries: 2,
  });

  return body;
}
