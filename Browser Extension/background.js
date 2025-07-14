// background.js
// Service worker for the Chrome extension.
// Handles updating the action badge and forwarding feedback.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PROMPT_SCORE' && sender.tab) {
    const { score } = request;
    const { tabId } = sender.tab;

    // If the score is null, it means the textarea is empty.
    if (score === null) {
      chrome.action.setBadgeText({ text: '–', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#9e9e9e', tabId });
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
  } else if (request.type === 'FEEDBACK') {
    // Fire-and-forget feedback call to the API
    fetch('https://fixmyprompts.com/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: request.value,
        score: request.score,
        ts: new Date().toISOString()
      })
    }).catch(err => console.error('Feedback API call failed:', err));
  }
  // Keep the message channel open for other potential async responses
  return true;
});

// The install event is a good place for setting initial state,
// but we don't have any for this extension.
self.addEventListener('install', () => {
  // No-op
}); 