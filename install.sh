#!/bin/bash

# Define the GitHub repository and the name of the binary.
GITHUB_REPO="Flaque/lintrule"
BINARY_NAME="rules"

# Define the target directory where the 'rules' CLI binary will be installed.
# You can use '/usr/.local/bin' as a common location that is sometimes 
# in the user's PATH.
TARGET_DIR="${HOME}/.local/bin"

# Make sure the target dir exists
mkdir -p "${TARGET_DIR}"

# Define the target file path for the 'rules' CLI binary.
TARGET_FILE="${TARGET_DIR}/${BINARY_NAME}"

# Use the GitHub API to get the latest release information.
echo "Fetching the latest release information..."
LATEST_RELEASE_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
LATEST_RELEASE_JSON=$(curl -s "${LATEST_RELEASE_URL}")

# Extract the download URL for the 'rules' binary from the release information.
RULES_BINARY_URL=$(echo "${LATEST_RELEASE_JSON}" | grep "\"browser_download_url\":" | grep "${BINARY_NAME}" | sed -n 's/.*"browser_download_url": "\(.*\)"/\1/p')

# Check if the download URL was found.
if [ -z "${RULES_BINARY_URL}" ]; then
    echo "Failed to find the download URL for the '${BINARY_NAME}' binary."
    echo "Please check the GitHub repository and release information."
    exit 1
fi

# Download the 'rules' CLI binary from the specified URL.
echo "Downloading '${BINARY_NAME}' CLI binary..."
echo "curl -L -o \"${TARGET_FILE}\" \"${RULES_BINARY_URL}\""
curl -L -o "${TARGET_FILE}" "${RULES_BINARY_URL}"

# Make the downloaded binary executable.
chmod +x "${TARGET_FILE}"


# Verify that the 'rules' CLI binary is successfully installed.
if [ -f "${TARGET_FILE}" ]; then
    echo "Successfully installed '${BINARY_NAME}' CLI."
    echo "The binary is located at '${TARGET_FILE}'."

    # Provide instructions for adding the target directory to the PATH.
    echo -e "\033[0;32m"
    echo -e "To use the '${BINARY_NAME}' command, add '${TARGET_DIR}' to your PATH."
    echo -e "You can do this by running one of the following commands, depending on your shell:"
    echo -e "\033[0m"
    echo -e "\033[0;32mFor bash:"
    echo -e "\033[1m  echo 'export PATH=\"${TARGET_DIR}:\$PATH\"' >> ~/.bashrc && source ~/.bashrc\033[0m"
    echo -e "\033[0;32m"
    echo -e "\033[0;32mFor zsh:"
    echo -e "\033[1m  echo 'export PATH=\"${TARGET_DIR}:\$PATH\"' >> ~/.zshrc && source ~/.zshrc\033[0m"
    echo -e "\033[0;32m"
    echo -e "After running the appropriate command, you can use '${BINARY_NAME}'.\033[0m"


else
    echo "Installation failed. '${BINARY_NAME}' CLI could not be installed."
fi
