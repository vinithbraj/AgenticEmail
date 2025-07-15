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

import { STORAGE_KEY, StorageResponse } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_EMAIL') {
    const { payload } = message;
    const startTime = message.startTime || Date.now();

    // Set initial loading state
    const loadingState: StorageResponse = {
      isLoading: true,
      timestamp: startTime,
      timing: {
        startTime,
        endTime: 0,
        duration: 0,
      },
      response: '',
      formState: payload, // Store the form state with the request
    };

    chrome.storage.local
      .set({
        [STORAGE_KEY]: loadingState,
      })
      .catch((err) => console.error('Error setting initial loading state:', err));

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

        // Create success response with timing info
        const endTime = Date.now();
        const successResponse: StorageResponse = {
          data: { response: data.response },
          response: data.response,
          timestamp: endTime,
          isLoading: false,
          timing: {
            startTime,
            endTime,
            duration: (endTime - startTime) / 1000, // in seconds
          },
          formState: payload, // Keep the form state
        };

        await chrome.storage.local.set({
          [STORAGE_KEY]: successResponse,
        });

        console.log('Response stored successfully');
      } catch (err) {
        console.error('Error in background script:', err);

        // Create error response with timing info
        const errorTime = Date.now();
        const errorResponse: StorageResponse = {
          error: err instanceof Error ? err.message : 'Unknown error occurred',
          response: '',
          timestamp: errorTime,
          isLoading: false,
          timing: {
            startTime,
            endTime: errorTime,
            duration: (errorTime - startTime) / 1000,
          },
          formState: payload, // Keep the form state
        };

        // Store the error in storage
        await chrome.storage.local.set({
          [STORAGE_KEY]: errorResponse,
        });
      }
    })();

    // Return true to indicate we'll send the response asynchronously
    return true;
  }
});
