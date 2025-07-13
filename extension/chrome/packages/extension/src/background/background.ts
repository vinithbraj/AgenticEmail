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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_EMAIL') {
    const { payload } = message;

    // Start async work inside IIFE
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        sendResponse({ data }); // Send back result
      } catch (err) {
        console.error(err);
        sendResponse({
          error: err instanceof Error ? err.message : String(err)
        });
      }
    })();

    return true; // ✅ Keeps response channel open
  }
});