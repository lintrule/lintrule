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
}: {
  url: string;
  accessToken: string;
  documentRule: DocumentRule;
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

  // Check if the response is ok
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  // Read the response body into a DocumentRuleResponse object
  const body: DocumentRuleResponse = await res.json();

  return body;
}

export async function check({
  documentPath,
  host,
  rulePath,
  accessToken,
}: {
  host: string;
  documentPath: string;
  rulePath: string;
  accessToken: string;
}): Promise<DocumentRuleResponse> {
  // Read the document
  const document = await Deno.readTextFile(documentPath);

  // Read the rule
  const rule = await Deno.readTextFile(rulePath);

  const body = await sendRule({
    url: `${host}/api/check`,
    accessToken,
    documentRule: {
      document,
      rule,
    },
  });

  return body;
}
