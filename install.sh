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


# Make sure the target dir exists
mkdir -p "${TARGET_DIR}"

# Define the target file path for the 'rules' CLI binary.
TARGET_FILE="${TARGET_DIR}/${BINARY_NAME}"

# Use the GitHub API to get the latest release information.
echo "Fetching the latest release information..."
LATEST_RELEASE_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
LATEST_RELEASE_JSON=$(curl -s "${LATEST_RELEASE_URL}")

case $(uname -ms) in
'Darwin x86_64')
    target=darwin-x64
    ;;
'Darwin arm64')
    target=darwin-aarch64
    ;;
'Linux aarch64' | 'Linux arm64')
    target=linux-aarch64
    ;;
'Linux x86_64' | *)
    target=linux-x64
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

if [[ $target = darwin-x64 ]]; then
    # If AVX2 isn't supported, use the -baseline build
    if [[ $(sysctl -a | grep machdep.cpu | grep AVX2) == '' ]]; then
        target=darwin-x64-baseline
    fi
fi

if [[ $target = linux-x64 ]]; then
    # If AVX2 isn't supported, use the -baseline build
    if [[ $(cat /proc/cpuinfo | grep avx2) = '' ]]; then
        target=linux-x64-baseline
    fi
fi

if [[ $# = 0 ]]; then
    RULES_BINARY_URL=$github_repo/releases/latest/download/bun-$target.zip
else
    RULES_BINARY_URL=$github_repo/releases/download/$1/bun-$target.zip
fi

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
