# AgenticEmail

An intelligent Chrome extension that helps you draft email responses using a locally-run language model. AgenticEmail integrates with your browser to provide AI-powered email drafting capabilities while keeping your data private and secure.

## ✨ Features

- Generate email responses using local AI models
- Customize tone and response length
- Works with any email client in your browser
- Private and secure - all processing happens locally
- Easy to install and use

## 🚀 Getting Started

### Prerequisites

- macOS (other platforms may work but are untested)
- Homebrew (for package management)
- Node.js and npm (for building the extension)
- Python 3.8+ (for the backend server)
- Ollama (for running local language models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AgenticEmail.git
   cd AgenticEmail
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This will:
   - Install Homebrew (if not already installed)
   - Install Python 3 (if not already installed)
   - Install Ollama (if not already installed)
   - Set up a Python virtual environment
   - Install all required Python dependencies

3. **Start the backend server**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
   This will:
   - Pull the required language model (specified in model.txt)
   - Start the FastAPI server on http://localhost:8000

### Building the Chrome Extension

1. **Navigate to the extension directory**
   ```bash
   cd extension/chrome/packages/extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   This will create a `dist` directory with the compiled extension.

4. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the `dist` directory

## 🎯 Usage

1. **Using the Extension**
   - Click the AgenticEmail icon in your Chrome toolbar
   - Select the text of the email you want to respond to
   - Enter your instructions for the response
   - Choose a tone (Professional, Friendly, Casual, or Formal)
   - Adjust the character limit as needed
   - Click "Generate Reply"

2. **Common Scenarios**
   - **Quick Response**: Just select the email text and click generate for a quick reply
   - **Custom Instructions**: Add specific instructions like "Decline the meeting" or "Ask for more details"
   - **Tone Adjustment**: Change the tone to match the formality of the original email

## 🛠 Troubleshooting

- **Model not loading**: Ensure Ollama is running and the model specified in `model.txt` is downloaded
- **Extension not working**: Check the browser's developer console (F12) for errors
- **Server connection issues**: Verify the backend server is running on http://localhost:8000

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
