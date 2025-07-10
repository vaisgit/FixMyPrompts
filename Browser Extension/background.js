// background.js
// Service worker for the Chrome extension.
// Handles updating the action badge based on the prompt quality score.

// Listen for messages from the content script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PROMPT_SCORE' && sender.tab) {
    const { score } = request;
    const { tabId } = sender.tab;

    // If the score is null, it means the textarea is empty.
    if (score === null) {
      chrome.action.setBadgeText({ text: '–', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#9e9e9e', tabId }); // Material Grey
    } else {
      // The score is a number, so update the badge text and color.
      const text = String(Math.round(score));
      let color;
      if (score >= 75) {
        color = '#2ecc71'; // Green
      } else if (score >= 50) {
        color = '#f39c12'; // Amber
      } else {
        color = '#e74c3c'; // Red
      }
      
      chrome.action.setBadgeText({ text, tabId });
      chrome.action.setBadgeBackgroundColor({ color, tabId });
    }
  }
  // Keep the message channel open for async response, though not used here.
  return true;
});

// The install event is a good place for setting initial state,
// but we don't have any for this extension.
self.addEventListener('install', () => {
  // No-op
}); 