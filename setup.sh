#!/bin/bash

set -e

GREEN="\033[0;32m"
RESET="\033[0m"

echo -e "${GREEN}🔧 Starting environment setup...${RESET}"

# Step 1: Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
  echo -e "${GREEN}Installing Homebrew...${RESET}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo -e "${GREEN}✅ Homebrew is already installed.${RESET}"
fi

# Step 2: Install Python 3 if not installed
if ! command -v python3 &> /dev/null; then
  echo -e "${GREEN}Installing Python 3...${RESET}"
  brew install python
else
  echo -e "${GREEN}✅ Python 3 is already installed.${RESET}"
fi

# Step 3: Install ollama if not installed
if ! command -v ollama &> /dev/null; then
  echo -e "${GREEN}Installing Ollama...${RESET}"
  brew install ollama
else
  echo -e "${GREEN}✅ Ollama is already installed.${RESET}"
fi


# Step 3: Create virtual environment
PYTHON_BIN=$(which python3)
VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
  echo -e "${GREEN}Creating virtual environment in ${VENV_DIR}...${RESET}"
  $PYTHON_BIN -m venv $VENV_DIR
else
  echo -e "${GREEN}✅ Virtual environment already exists.${RESET}"
fi

# Step 4: Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${RESET}"
source $VENV_DIR/bin/activate

# Step 5: Upgrade pip and install project dependencies
echo -e "${GREEN}Upgrading pip...${RESET}"
pip install --upgrade pip

echo -e "${GREEN}Installing Python dependencies from requirements.txt...${RESET}"
pip install -r requirements.txt

echo -e "${GREEN}✅ All dependencies installed. Environment setup complete!${RESET}"
