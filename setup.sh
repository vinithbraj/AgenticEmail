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

# Step 5: Ensure pip is available (even if broken or missing)
echo -e "${GREEN}Ensuring pip is functional...${RESET}"

# Fully resolve the path to the Python binary inside the venv
PYTHON_IN_VENV="$VENV_DIR/bin/python"

# Check if pip works inside the virtual environment
if ! $PYTHON_IN_VENV -m pip --version &> /dev/null; then
  echo -e "${GREEN}pip is missing or broken in the virtual environment. Installing with get-pip.py...${RESET}"
  curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  $PYTHON_IN_VENV get-pip.py
  rm get-pip.py
else
  echo -e "${GREEN}✅ pip is working in the virtual environment.${RESET}"
fi

echo -e "${GREEN}Upgrading pip...${RESET}"
$PYTHON_IN_VENV -m pip install --upgrade pip

echo -e "${GREEN}Installing Python dependencies from requirements.txt...${RESET}"
$PYTHON_IN_VENV -m pip install -r requirements.txt

echo -e "${GREEN}✅ All dependencies installed. Environment setup complete!${RESET}"
