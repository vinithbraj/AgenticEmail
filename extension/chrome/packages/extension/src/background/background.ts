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

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Store to keep track of the latest response
const STORAGE_KEY = 'agenticEmailResponse';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_EMAIL') {
    const { payload } = message;
    const startTime = message.startTime || Date.now();

    // Set initial loading state
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        isLoading: true,
        timestamp: startTime,
        timing: {
          startTime,
          endTime: 0,
          duration: 0
        }
      }
    }).catch(err => console.error('Error setting initial loading state:', err));

    // Start async work
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        
        // Store the response in chrome.storage.local with timing info
        const endTime = Date.now();
        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            data,
            timestamp: endTime,
            isLoading: false, // Clear loading state
            timing: {
              startTime: startTime,
              endTime: endTime,
              duration: (endTime - startTime) / 1000 // in seconds
            }
          }
        });
        
        console.log('Response stored successfully');
      } catch (err) {
        console.error('Error in background script:', err);
        // Store the error in storage and clear loading state
        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            error: err instanceof Error ? err.message : 'Unknown error occurred',
            timestamp: Date.now(),
            isLoading: false,
            timing: {
              startTime: startTime,
              endTime: Date.now(),
              duration: (Date.now() - startTime) / 1000
            }
          }
        });
      }
    })();
    
    // Return true to indicate we'll send the response asynchronously
    return true;
  }
});