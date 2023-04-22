use anyhow::{Context, Result};
use colored::*;
use ignore::Walk;
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
    let body: DocumentRuleResponse = serde_json::from_str(&body)
        .context(format!("Failed to parse response: {}", body))
        .unwrap();

    Ok(body)
}

async fn check(
    document_path: &str,
    rule_path: &str,
) -> Result<DocumentRuleResponse, reqwest::Error> {
    // Read a file
    let document = std::fs::read_to_string(document_path).unwrap();

    // Read the rule
    let rule = std::fs::read_to_string(rule_path).unwrap();

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
    // Iterate through every file in the current directory
    const PATH: &str = ".";

    // Recursively iterate through every file in the current directory
    for entry in Walk::new("./") {
        let entry = entry.unwrap();

        if entry.file_type().unwrap().is_dir() {
            continue;
        }

        let path = entry.path();
        const RULE_DIR: &str = "rules";

        // Skipped extensions
        let skipped_extensions = vec![
            "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "mp4", "mp3", "wav", "ogg", "pdf",
            "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "exe", "dll", "so", "dylib", "ttf",
            "otf", "woff", "woff2", "eot", "psd", "ai", "sketch", "toml", "lock", "md", "txt",
            "log", "env",
        ];

        // if the file has a skipped extension, skip it
        if path.is_file() {
            let extension = path.extension().unwrap_or("".as_ref()).to_str().unwrap();

            if skipped_extensions.contains(&extension) {
                continue;
            }
        }

        // Skipped files
        let skipped_files = vec![".gitignore", ".env"];

        // if the file is a skipped file, skip it
        if path.is_file() {
            let file_name = path.file_name().unwrap().to_str().unwrap();

            if skipped_files.contains(&file_name) {
                continue;
            }
        }

        // check every file in the current directory
        // against every rule in the rules directory
        if path.is_file() {
            for rule in std::fs::read_dir(RULE_DIR).unwrap() {
                let rule: std::fs::DirEntry = rule.unwrap();
                let rule_path = rule.path();

                if rule_path.is_file() {
                    // If the file size is too big, skip it
                    if path.metadata().unwrap().len() > 1024 * 10 {
                        println!(
                            "🚨 {} - {}",
                            path.to_str().unwrap().red(),
                            "File too large".red()
                        );
                        continue;
                    }

                    let resp = check(&path.to_str().unwrap(), &rule_path.to_str().unwrap())
                        .await
                        .unwrap();

                    if !resp.pass {
                        // Print the error message
                        eprintln!(
                            "🚨 {} - {}",
                            path.to_str().unwrap().red(),
                            resp.message.red()
                        );

                        // Exit with a non-zero exit code
                        std::process::exit(1);
                    } else {
                        println!("✅ {}", path.to_str().unwrap().green());
                    }
                }
            }
        }
    }

    eprintln!("{}", "All checks passed!".green());
}
