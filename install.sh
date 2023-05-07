#!/bin/bash

# Define the GitHub repository and the name of the binary.
GITHUB_REPO="Flaque/lintrule"
BINARY_NAME="rules"

# Define the target directory where the 'rules' CLI binary will be installed.
# You can use '/usr/local/bin' as a common location that is usually in the user's PATH.
TARGET_DIR="/usr/local/bin"

# Define the target file path for the 'rules' CLI binary.
TARGET_FILE="${TARGET_DIR}/${BINARY_NAME}"

# Use the GitHub API to get the latest release information.
echo "Fetching the latest release information..."
LATEST_RELEASE_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
LATEST_RELEASE_JSON=$(curl -s "${LATEST_RELEASE_URL}")

# Extract the download URL for the 'rules' binary from the release information.
RULES_BINARY_URL=$(echo "${LATEST_RELEASE_JSON}" | grep -oP '"browser_download_url": "\K[^"]+' | grep "${BINARY_NAME}")

# Check if the download URL was found.
if [ -z "${RULES_BINARY_URL}" ]; then
    echo "Failed to find the download URL for the '${BINARY_NAME}' binary."
    echo "Please check the GitHub repository and release information."
    exit 1
fi

# Download the 'rules' CLI binary from the specified URL.
echo "Downloading '${BINARY_NAME}' CLI binary..."
curl -s -L -o "${TARGET_FILE}" "${RULES_BINARY_URL}"

# Make the downloaded binary executable.
chmod +x "${TARGET_FILE}"

# Verify that the 'rules' CLI binary is successfully installed and accessible.
if command -v "${BINARY_NAME}" >/dev/null 2>&1; then
    echo "Successfully installed '${BINARY_NAME}' CLI."
    echo "You can now use the '${BINARY_NAME}' command."
else
    echo "Installation failed. '${BINARY_NAME}' CLI is not accessible."
    echo "Make sure that '${TARGET_DIR}' is part of your PATH."
fi
