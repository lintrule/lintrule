use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct DocumentRule {
    document: String,
    rule: String,
}

async fn send_rule(url: &str, document_rule: DocumentRule) -> Result<String, reqwest::Error> {
    // Create a client to make HTTP requests
    let client = Client::new();

    let json = serde_json::to_string(&document_rule).unwrap();

    // Send the POST request to the given URL with document and rule as parameters
    let res = client.post(url).body(json).send().await?;

    // Read the response body into a string
    let body = res.text().await?;

    Ok(body)
}
// A simple binary file
#[tokio::main]
async fn main() {
    // Read a file
    let document = std::fs::read_to_string("src/main.rs").unwrap();

    // Read the rule
    let rule = std::fs::read_to_string("rules/dummy.md").unwrap();

    let body = send_rule(
        "http://localhost:8080/check",
        DocumentRule { document, rule },
    )
    .await
    .unwrap();

    println!("{}", body);
}
