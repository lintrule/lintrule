// document_rule.ts
export interface DocumentRule {
  document: string;
  rule: string;
}

export interface DocumentRuleResponse {
  pass: boolean;
  message?: string;
}

export async function sendRule(
  url: string,
  documentRule: DocumentRule
): Promise<DocumentRuleResponse> {
  // Create a headers object with the content type
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

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

export async function check(
  domain: string,
  documentPath: string,
  rulePath: string
): Promise<DocumentRuleResponse> {
  // Read the document
  const document = await Deno.readTextFile(documentPath);

  // Read the rule
  const rule = await Deno.readTextFile(rulePath);

  const body = await sendRule(`${domain}/check`, {
    document,
    rule,
  });

  return body;
}

console.log("hi");
