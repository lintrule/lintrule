#!/bin/bash

# Define the GitHub repository and the name of the binary.
GITHUB_REPO="Flaque/lintrule"
BINARY_NAME="rules"

# Check the operating system
OS="$(uname)"

# If the operating system is Linux, set the target directory to '/usr/local/bin'
# If the operating system is Darwin (macOS), set the target directory to '${HOME}/.local/bin'
if [[ "$OS" == "Linux" ]]; then
  TARGET_DIR="/usr/local/bin"
elif [[ "$OS" == "Darwin" ]]; then
  TARGET_DIR="${HOME}/.local/bin"
else
  echo "Unsupported operating system: $OS"
  exit 1
fi

command -v unzip >/dev/null ||
    error 'unzip is required to install lintrule'


# Make sure the target dir exists
mkdir -p "${TARGET_DIR}"

# Define the target file path for the 'rules' CLI binary.
TARGET_FILE="${TARGET_DIR}/${BINARY_NAME}"

case $(uname -ms) in
'Darwin x86_64')
    target=x86_64-apple-darwin
    ;;
'Darwin arm64')
    target=aarch64-apple-darwin
    ;;
'Linux x86_64' | *)
    target=x86_64-unknown-linux-gnu
    ;;
esac

if [[ $target = darwin-x64 ]]; then
    # Is this process running in Rosetta?
    # redirect stderr to devnull to avoid error message when not running in Rosetta
    if [[ $(sysctl -n sysctl.proc_translated 2>/dev/null) = 1 ]]; then
        target=darwin-aarch64
        info "Your shell is running in Rosetta 2. Downloading rules for $target instead"
    fi
fi

GITHUB=${GITHUB-"https://github.com"}

github_repo="$GITHUB/$GITHUB_REPO"

if [[ $# = 0 ]]; then
    RULES_BINARY_URL=$github_repo/releases/latest/download/rules-$target.zip
else
    RULES_BINARY_URL=$github_repo/releases/download/$1/rules-$target.zip
fi

# Check if the download URL was found.
if [ -z "${RULES_BINARY_URL}" ]; then
    echo "Failed to find the download URL for the '${BINARY_NAME}' binary."
    echo "Please check the GitHub repository and release information."
    exit 1
fi

# Download the 'rules' CLI binary from the specified URL.
echo "Downloading '${BINARY_NAME}' CLI binary..."
echo "curl -L -o \"${TARGET_FILE}.zip\" \"${RULES_BINARY_URL}\""
curl -L -o "${TARGET_FILE}.zip" "${RULES_BINARY_URL}"

echo "unzip -o \"${TARGET_FILE}.zip\" -d \"${TARGET_DIR}/dist\""
unzip -o "$TARGET_FILE.zip" -d "$TARGET_DIR/dist" ||
    error 'Failed to extract rules'

# rename the binary to 'rules'
mv "$TARGET_DIR/dist/rules-$target" "$TARGET_DIR/$BINARY_NAME"


# Make the downloaded binary executable.
chmod +x "${TARGET_FILE}"

# remove the dist directory
rm -rf "$TARGET_DIR/dist"

# remove the downloaded zip file
rm "$TARGET_FILE.zip"


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
