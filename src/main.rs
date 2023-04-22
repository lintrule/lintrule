use colored::*;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct DocumentRule {
    document: String,
    rule: String,
}

#[derive(Serialize, Deserialize)]
struct DocumentRuleResponse {
    pass: bool,
    message: String,
}

async fn send_rule(
    url: &str,
    document_rule: DocumentRule,
) -> Result<DocumentRuleResponse, reqwest::Error> {
    // Create a client to make HTTP requests
    let client = Client::new();

    let json = serde_json::to_string(&document_rule).unwrap();

    // Send the POST request to the given URL with document and rule as parameters
    let res = client.post(url).body(json).send().await?;

    // Read the response body into a string
    let body = res.text().await?;

    // Parse the response body into a DocumentRuleResponse struct
    let body: DocumentRuleResponse = serde_json::from_str(&body).unwrap();

    Ok(body)
}

async fn check(
    document_path: &str,
    rule_path: &str,
) -> Result<(DocumentRuleResponse), reqwest::Error> {
    // Read a file
    let document = std::fs::read_to_string("code.js").unwrap();

    // Read the rule
    let rule = std::fs::read_to_string("rules/dummy.md").unwrap();

    let body = send_rule(
        "http://localhost:8080/check",
        DocumentRule { document, rule },
    )
    .await
    .unwrap();

    Ok(body)
}

#[tokio::main]
async fn main() {
    let resp = check("code.js", "rules/dummy.md").await.unwrap();

    if !resp.pass {
        // Print the error message
        eprintln!("{}", resp.message.red());

        // Exit with a non-zero exit code
        std::process::exit(1);
    }

    // Print the success message
    eprintln!("{}", resp.message);
}
