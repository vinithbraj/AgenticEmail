import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [prompt, setPrompt] = useState('');

  const handleGenerateReply = async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute script to get selected text in the active tab
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => window.getSelection()?.toString().trim() || ''
      });

      const selectedText = result.result as string;
      
      if (!selectedText) {
        alert('An email was not selected');
        return;
      }
      
      console.log('Selected text:', selectedText);
      console.log('Prompt:', prompt);

      if (!prompt.trim()) {
        alert('Please enter a prompt');
        return;
      }
      
      // Make API request to localhost server
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          email: selectedText
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Show the response in an alert
      if (data.response) {
        alert(data.response);
      } else {
        alert('No response received from the server');
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request');
    }
  };

  return (
    <div style={{ padding: '16px', minWidth: '300px' }}>
      <h2>Email Reply Generator</h2>
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="prompt" style={{ display: 'block', marginBottom: '4px' }}>
          Prompt:
        </label>
        <input
          id="prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          placeholder="Enter your prompt here"
        />
      </div>
      <button
        onClick={handleGenerateReply}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Generate Reply
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
