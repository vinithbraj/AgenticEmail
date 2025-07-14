/**
 * Copyright (c) 2025 Vinith Raj
 *
 * This file is part of AgenticEmail.
 * AgenticEmail is free software: you can use, modify, and/or distribute it
 * under the terms of the MIT License. See the LICENSE file for more details.
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see <https://opensource.org/licenses/MIT>.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

interface TimingInfo {
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}

interface FormState {
  prompt: string;
  tone: string;
  charLimit: string;
}

interface StorageResponse {
  data?: {
    response: string;
  };
  response: string;
  error?: string;
  timestamp: number;
  isLoading?: boolean;
  timing?: TimingInfo;
  formState?: FormState;
}

const STORAGE_KEY = 'agenticEmailResponse';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [charLimit, setCharLimit] = useState('500');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const isFirstLoad = useRef(true);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Update storage with current elapsed time periodically
  useEffect(() => {
    if (!isLoading || !generationStartTime) return;
    
    const updateStorage = async () => {
      try {
        const currentElapsed = (Date.now() - generationStartTime) / 1000;
        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            isLoading: true,
            timing: {
              startTime: generationStartTime,
              elapsedTime: currentElapsed,
              duration: currentElapsed
            },
            timestamp: Date.now()
          }
        });
      } catch (err) {
        console.error('Error updating storage:', err);
      }
    };

    // Update storage every second while loading
    const interval = setInterval(updateStorage, 1000);
    return () => clearInterval(interval);
  }, [isLoading, generationStartTime]);

  // Save form state to storage
  const saveFormState = async () => {
    const formState = {
      prompt,
      tone,
      charLimit
    };
    
    try {
      const currentData = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...currentData,
          formState
        }
      });
    } catch (err) {
      console.error('Error saving form state:', err);
    }
  };

  // Save form state when inputs change
  useEffect(() => {
    if (!isLoading && !isFirstLoad.current) {
      saveFormState();
    }
  }, [prompt, tone, charLimit, isLoading]);

  // Load saved state when component mounts
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        if (!isFirstLoad.current) return;
        isFirstLoad.current = false;
        
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const storedData: StorageResponse | undefined = result[STORAGE_KEY];
        
        if (storedData) {
          // Restore form state
          if (storedData.formState) {
            setPrompt(storedData.formState.prompt || '');
            setTone(storedData.formState.tone || 'professional');
            setCharLimit(storedData.formState.charLimit || '500');
          }

          if (storedData.isLoading && storedData.timing?.startTime) {
            // If loading was in progress, continue from where we left off
            const now = Date.now();
            const elapsed = (now - storedData.timing.startTime) / 1000;
            setElapsedTime(elapsed);
            setGenerationStartTime(storedData.timing.startTime);
            setIsLoading(true);
            
            // Start the timer from the persisted time
            const interval = window.setInterval(() => {
              setElapsedTime(prev => (Date.now() - (storedData.timing?.startTime || now)) / 1000);
            }, 100);
            setTimerInterval(interval);
          } else if (storedData.error) {
            setError(storedData.error);
            setIsLoading(false);
          } else if (storedData.data?.response) {
            setResponse(storedData.data.response);
            setIsLoading(false);
            if (storedData.timing?.duration) {
              setGenerationTime(storedData.timing.duration);
            }
          }
        }
      } catch (error) {
        console.error('Error loading stored state:', error);
        setIsLoading(false);
      }
    };
    
    loadStoredState();
    
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      try {
        if (changes[STORAGE_KEY]?.newValue) {
          const newData: StorageResponse = changes[STORAGE_KEY].newValue;
          
          if (newData.isLoading) {
            setIsLoading(true);
            setResponse(null);
            setError(null);
            setGenerationTime(null);
          } else if (newData.error) {
            setIsLoading(false);
            setError(newData.error);
            setResponse(null);
            setGenerationTime(null);
          } else if (newData.data?.response) {
            setIsLoading(false);
            setResponse(newData.data.response);
            setError(null);
            if (newData.timing?.duration) {
              setGenerationTime(newData.timing.duration);
            }
          }
        }
      } catch (error) {
        console.error('Error handling storage change:', error);
        setIsLoading(false);
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

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
        throw new Error('A snippet of text for email response was not selected');
      }
      
      if (!prompt.trim()) {
        throw new Error('Please provide instructions for the email response.');
      }
      
      // Reset states and set loading state in storage
      setResponse(null);
      setError(null);
      setGenerationTime(null);
      setIsLoading(true);
      
      // Store the start time
      const startTime = Date.now();
      setGenerationStartTime(startTime);
      
      // Start the timer
      const interval = window.setInterval(() => {
        setElapsedTime(prev => (Date.now() - startTime) / 1000);
      }, 100);
      setTimerInterval(interval);

      // Save initial loading state with timing info
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          isLoading: true,
          timing: { 
            startTime,
            elapsedTime: 0
          },
          timestamp: Date.now()
        }
      });
      
      const payload = {
        action_instruction: prompt,
        email: selectedText,
        tone: tone,
        char_limit: parseInt(charLimit)
      };
  
      // Send message to background script (don't clear storage here - we want to keep loading state)
      chrome.runtime.sendMessage({ type: 'GENERATE_EMAIL', payload });
      
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      // Show the actual error message if available, otherwise show a generic message
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request');
    }
  };

  const copyToClipboard = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(response);
        alert('Response copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const clearResponse = async () => {
    try {
      // Save the current form state before clearing
      const formState = { prompt, tone, charLimit };
      
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          data: null,
          error: null,
          isLoading: false,
          timing: null,
          formState
        }
      });
      
      setResponse(null);
      setError(null);
      setGenerationTime(null);
      setElapsedTime(0);
      setGenerationStartTime(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to clear response:', err);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="popup-container">
        <h2>Email Reply Generator</h2>
        <div className="loading-container">
          <div className="loading-icon">⏳</div>
          <p className="loading-text">Generating your response...</p>
          <div className="timer">
            {elapsedTime.toFixed(1)} seconds elapsed
          </div>
        </div>
      </div>
    );
  }

  // Render main UI with input controls or response
  return (
    <div className="popup-container">
      <h2>Email Reply Generator</h2>
      {error && (
        <div className="error-container">
          <div className="error-message">
            Error: {error}
          </div>
          <button 
            className="action-button clear-button"
            onClick={clearResponse}
            title="Clear error"
          >
            Clear
          </button>
        </div>
      )}

      {!response && !error && (
        <>
          <div className="form-group">
            <label htmlFor="prompt">Instructions:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your instructions here"
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tone">Tone:</label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="charLimit">Character Limit: {charLimit}</label>
            <input
              type="range"
              id="charLimit"
              min="50"
              max="1000"
              step="50"
              value={charLimit}
              onChange={(e) => setCharLimit(e.target.value)}
            />
          </div>
          
          <button
            className="generate-button"
            onClick={handleGenerateReply}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Generate Reply
          </button>
        </>
      )}

      {response && (
        <div className="response-container">
          <div className="response-header">
            <h3>Generated Response:</h3>
            <div className="actions-container">
              <button 
                className="action-button copy-button"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                Copy
              </button>
              <button 
                className="action-button clear-button"
                onClick={clearResponse}
                title="Clear response"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            className="response-textarea"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          {generationTime !== null && (
            <div className="generation-time">
              Generated in {generationTime.toFixed(2)} seconds
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add global styles
const style = document.createElement('style');
document.head.appendChild(style);

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
