// content.js
// This script injects a floating score card on supported AI chat sites.
// It is designed to be resilient to dynamic page updates.

(function () {
  // Prevent the script from being injected multiple times.
  if (window.__fixMyPromptsInjected) {
    return;
  }
  window.__fixMyPromptsInjected = true;

  let promptTextarea = null;
  let scoreCard = null;
  let scoreGaugeFg = null;
  let scoreValueText = null;
  let actionBar = null;
  let observer = null;

  /**
   * Programmatically sets the value of an input/textarea and dispatches the
   * events necessary to notify frameworks like React that the value has changed.
   * @param {HTMLElement} element The textarea or input element.
   * @param {string} value The value to set.
   */
  function setNativeValueAndDispatchEvents(element, value) {
    // Get the property descriptor for 'value' to check for a native setter.
    const valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');

    if (valueDescriptor && typeof valueDescriptor.set === 'function') {
      // This is a standard input/textarea. Use the native setter trick for framework compatibility.
      valueDescriptor.set.call(element, value);
    } else {
      // This is likely a contenteditable div. Fall back to setting textContent.
      element.textContent = value;
    }

    // Dispatch a series of events to ensure the framework is notified of the change.
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
    ];
    
    events.forEach(event => element.dispatchEvent(event));
  }

  /**
   * Scores a prompt based on several dimensions like length, clarity, and specificity.
   * @param {string} text The prompt text to score.
   * @returns {{score: number, tips: string[]}} An object containing the score and improvement tips.
   */
  function scorePrompt(text) {
    // Weights are the maximum points for each dimension
    const weights = { length: 25, clarity: 15, specific: 15, vague: 15, dup: 10, variety: 20 };
    // Penalties start at 0 and are subtracted from 100
    const penalties = { length: 0, clarity: 0, specific: 0, vague: 0, dup: 0, variety: 0 };
    const len = text.length;

    // 1. Length penalty (mirrors original logic)
    if (len < 50 || len > 250) {
      if (len < 20 || len > 500) {
        penalties.length = weights.length; // 0/25 points
      } else {
        penalties.length = Math.floor(weights.length / 2); // 12/25 points
      }
    }

    // 2. Clarity penalty (mirrors original logic)
    if (!/[?.]|\\b(?:explain|generate|compare|summarize|write|list)\\b/i.test(text)) {
      penalties.clarity = weights.clarity;
    }

    // 3. Specificity penalty (mirrors original logic)
    if (!/\\b(?:for|to a|to an|as a|as an|in the style of|json|table)\\b/i.test(text)) {
      penalties.specific = weights.specific;
    }

    // 4. Vagueness penalty (mirrors original logic)
    if (/\\b(?:good|nice|interesting|cool|beautiful)\\b/i.test(text)) {
      penalties.vague = weights.vague;
    }

    // 5. Repetition penalty (mirrors original logic)
    if (/\\b(\\w+)\\s+\\1\\b/i.test(text)) {
      penalties.dup = weights.dup;
    }

    // 6. Variety penalty (mirrors original logic)
    const tokens = text.toLowerCase().match(/\\b\\w+\\b/g) || [];
    const uniqueTokens = new Set(tokens);
    const varietyRatio = tokens.length > 0 ? uniqueTokens.size / tokens.length : 1;
    if (varietyRatio < 0.8) {
      if (varietyRatio < 0.5) {
        penalties.variety = weights.variety; // 0/20 points
      } else {
        penalties.variety = Math.floor(weights.variety / 2); // 10/20 points
      }
    }
    
    // Calculate final score by subtracting penalties from 100
    const totalPenalty = Object.values(penalties).reduce((sum, p) => sum + p, 0);
    const score = Math.max(0, 100 - totalPenalty);

    return { score, breakdown: penalties };
  }

  // Debounce utility to limit how often a function is called.
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Find the most likely main prompt input on the page.
  function findPromptTextarea() {
    const selectors = [
      'textarea[name="prompt-textarea"]', // Specific selector for ChatGPT
      'textarea[data-id="root"]',          // Old ChatGPT
      'textarea[placeholder*="Message"]',  // Common pattern
      'div[contenteditable="true"][aria-label*="prompt"]',
      'div[contenteditable="true"][aria-label*="message"]',
      'textarea',                          // Fallback
      'div[contenteditable="true"]',        // Fallback
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el)) {
        return el;
      }
    }
    return null;
  }
  
  // Check if an element is sufficiently visible to be considered a target.
  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    // Also check that it has a reasonable size.
    return isVisible && rect.width > 50 && rect.height > 20;
  }

  // This function is called when the user types in the prompt textarea.
  const onPromptInput = debounce(async (event) => {
    const text = event.target.value || event.target.textContent || '';
    
    // If the score card is hidden (e.g., after a rewrite), show it again.
    if (scoreCard && !scoreCard.classList.contains('visible')) {
      scoreCard.classList.add('visible');
    }

    if (text.trim() === '') {
      updateScoreCard(null);
      chrome.storage.local.remove('fmpCurrentPromptData');
      return;
    }
    const { score, breakdown } = scorePrompt(text);
    updateScoreCard(score);
    chrome.storage.local.set({ fmpCurrentPromptData: { score, breakdown, text } });
  }, 300);

  const onPromptKeyUp = (event) => {
    const text = event.target.value || event.target.textContent || '';
    if (text.trim() === '') {
      updateScoreCard(null);
    }
  };
  
  // Updates the entire score card UI based on the new score.
  function updateScoreCard(score) {
    if (!scoreCard) return;

    if (score === null) {
      scoreValueText.textContent = '-';
      scoreValueText.className = ''; // Reset class
      actionBar.className = 'fmp-action-bar is-waiting';
      actionBar.innerHTML = 'Waiting for prompt...';
      setGauge(0, 'var(--fmp-score-color-base)');
      return;
    }

    scoreValueText.textContent = score;
    const percentage = score / 100;
    
    // Update gauge color and score text color via classes
    let gaugeColorVar;
    let scoreClass;
    if (score < 50) {
      gaugeColorVar = 'var(--fmp-score-color-bad)';
      scoreClass = 'is-bad';
    } else if (score < 90) {
      gaugeColorVar = 'var(--fmp-score-color-ok)';
      scoreClass = 'is-ok';
    } else {
      gaugeColorVar = 'var(--fmp-score-color-good)';
      scoreClass = 'is-good';
    }
    // Add a special class if the score is 3 digits to shrink the font
    if (score === 100) {
      scoreClass += ' is-triple-digit';
    }
    scoreValueText.className = scoreClass;
    setGauge(percentage, gaugeColorVar);

    // Update action bar
    if (score < 90) {
      actionBar.className = 'fmp-action-bar is-warning';
      actionBar.textContent = 'Fix issues';
    } else {
      actionBar.className = 'fmp-action-bar is-success';
      actionBar.textContent = 'Solid prompt';
    }
  }

  // Helper to update the SVG gauge.
  function setGauge(percentage, color) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage * circumference);
    scoreGaugeFg.style.strokeDasharray = `${circumference}`;
    scoreGaugeFg.style.strokeDashoffset = offset;
    scoreGaugeFg.style.stroke = color;
  }

  // Attach event listeners to the identified prompt textarea.
  function attachToTextarea(textarea) {
    if (!textarea) return;
    promptTextarea = textarea;
    textarea.addEventListener('input', onPromptInput);
    textarea.addEventListener('keyup', onPromptKeyUp);
    onPromptInput({ target: textarea }); // Initial check
  }

  // Main initialization function for the content script.
  function initialize() {
    createScoreCard();
    const textarea = findPromptTextarea();
    if (textarea) {
      attachToTextarea(textarea);
      scoreCard.classList.add('visible');
    }
    startObserver();
  }

  // Use MutationObserver to detect when the textarea is added or removed.
  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      const newTextarea = findPromptTextarea();
      if (newTextarea && newTextarea !== promptTextarea) {
        attachToTextarea(newTextarea);
        scoreCard.classList.add('visible');
      } else if (!newTextarea && promptTextarea) {
        promptTextarea = null;
        scoreCard.classList.remove('visible');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Create the floating score card element.
  function createScoreCard() {
    if (document.getElementById('fixmyprompts-score-card')) return;
    
    scoreCard = document.createElement('div');
    scoreCard.id = 'fixmyprompts-score-card';
    const logoUrl = chrome.runtime.getURL('logo.png');
    scoreCard.innerHTML = `
      <div class="fmp-card-header">
        <div class="fmp-score-label">
          <img src="${logoUrl}" alt="FixMyPrompts" class="fmp-logo-img">
          <span>PROMPT SCORE</span>
        </div>
        <div class="fmp-gauge">
          <svg class="fmp-gauge-svg" viewBox="0 0 100 100">
            <circle class="fmp-gauge-bg" cx="50" cy="50" r="40"></circle>
            <circle class="fmp-gauge-fg" id="fmp-gauge-fg" cx="50" cy="50" r="40"></circle>
          </svg>
          <div class="fmp-gauge-text">
            <span id="fmp-score-value">-</span>
            <span id="fmp-score-total">/100</span>
          </div>
        </div>
      </div>
      <button class="fmp-action-bar" id="fmp-action-bar">Waiting for prompt...</button>
    `;
    document.body.appendChild(scoreCard);

    // Cache elements
    scoreGaugeFg = scoreCard.querySelector('#fmp-gauge-fg');
    scoreValueText = scoreCard.querySelector('#fmp-score-value');
    actionBar = scoreCard.querySelector('#fmp-action-bar');
    actionBar.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('fmp-open-sidebar'));
    });
    
    // Set initial gauge state
    setGauge(0, 'var(--fmp-score-color-base)');

    // Make the card draggable
    makeDraggable(scoreCard);
  }

  function makeDraggable(element) {
    let isDragging = false;
    let hasSetInitialPosition = false;
    let xOffset = 0;
    let yOffset = 0;
    
    // Use the whole card as the drag handle, but not the button
    element.addEventListener('mousedown', (e) => {
      // Ignore clicks on the action button
      if (e.target.closest('.fmp-action-bar')) {
        return;
      }
      e.preventDefault(); // Prevent text selection and other default actions
      isDragging = true;
      
      // On first drag, switch from bottom/right to top/left positioning
      if (!hasSetInitialPosition) {
        const rect = element.getBoundingClientRect();
        element.style.top = `${rect.top}px`;
        element.style.left = `${rect.left}px`;
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        hasSetInitialPosition = true;
      }

      xOffset = e.clientX - element.offsetLeft;
      yOffset = e.clientY - element.offsetTop;
      
      // Add listeners to the document to capture mouse movement everywhere
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true }); // Remove after one fire
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(() => {
        const x = e.clientX - xOffset;
        const y = e.clientY - yOffset;
        element.style.transform = `translate(${x - element.offsetLeft}px, ${y - element.offsetTop}px)`;
      });
    }

    function onMouseUp() {
      isDragging = false;
      // To "land" the element, update top/left and reset transform
      const currentTransform = new DOMMatrix(window.getComputedStyle(element).transform);
      const newTop = element.offsetTop + currentTransform.m42;
      const newLeft = element.offsetLeft + currentTransform.m41;
      
      element.style.top = `${newTop}px`;
      element.style.left = `${newLeft}px`;
      element.style.transform = '';
      
      document.removeEventListener('mousemove', onMouseMove);
    }
  }

  // --- Popup/overlay logic remains the same below ---

  // Show the overlay for improving the prompt.
  function onFabClick() {
    // When the FAB is clicked, it should open the overlay as before.
    // The scoring is separate from the click action.
    let prefill = '';
    if (promptTextarea) {
        const value = promptTextarea.value || promptTextarea.textContent;
        if (promptTextarea.selectionStart !== undefined && promptTextarea.selectionEnd !== undefined && promptTextarea.selectionStart !== promptTextarea.selectionEnd) {
            prefill = value.substring(promptTextarea.selectionStart, promptTextarea.selectionEnd);
        } else {
            prefill = value;
        }
    }
    showOverlay(prefill);
  }

  let overlay = null;
  function showOverlay(prefillText) {
    if (overlay) return;
    const logoUrl = chrome.runtime.getURL('logo.png');
    overlay = document.createElement('div');
    overlay.id = 'fixmyprompts-overlay';
    overlay.innerHTML = `
      <div class="fixmyprompts-modal">
        <img src="${logoUrl}" alt="FixMyPrompts Logo" style="display:block;margin:0 auto 10px auto;height:40px;">
        <h2 class="fixmyprompts-title">FixMyPrompts Helper</h2>
        <textarea class="fixmyprompts-textarea" rows="5" placeholder="Paste or type your prompt here...">${prefillText || ''}</textarea>
        <div class="fixmyprompts-categories" role="radiogroup" aria-label="Prompt category">
          <button type="button" class="fixmyprompts-pill selected" data-value="General" aria-checked="true">General</button>
          <button type="button" class="fixmyprompts-pill" data-value="Creative Writing" aria-checked="false">Creative Writing</button>
          <button type="button" class="fixmyprompts-pill" data-value="Research" aria-checked="false">Research</button>
          <button type="button" class="fixmyprompts-pill" data-value="Problem Solving" aria-checked="false">Problem Solving</button>
          <button type="button" class="fixmyprompts-pill" data-value="Image Generation" aria-checked="false">Image Generation</button>
        </div>
        <button class="fixmyprompts-action">Fix my prompt</button>
        <button class="fixmyprompts-close" title="Close">&times;</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Pill selection logic
    const pills = overlay.querySelectorAll('.fixmyprompts-pill');
    pills.forEach(pill => {
      pill.onclick = () => {
        pills.forEach(p => {
          p.classList.remove('selected');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('selected');
        pill.setAttribute('aria-checked', 'true');
      };
    });

    // Close overlay
    overlay.querySelector('.fixmyprompts-close').onclick = closeOverlay;
    overlay.onclick = (e) => { if (e.target === overlay) closeOverlay(); };

    // Action button
    overlay.querySelector('.fixmyprompts-action').onclick = async function () {
      const textarea = overlay.querySelector('.fixmyprompts-textarea');
      const selectedPill = overlay.querySelector('.fixmyprompts-pill.selected');
      const category = selectedPill ? selectedPill.getAttribute('data-value') : 'General';
      const originalPrompt = textarea.value.trim();
      if (!originalPrompt) {
        alert('Please enter a prompt.');
        return;
      }
      this.disabled = true;
      this.textContent = 'Improving...';
      try {
        const resp = await fetch('https://fixmyprompts.com/api/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalPrompt, category })
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        if (!data.improvedPrompt) throw new Error();
        showImprovedPromptUI(data.improvedPrompt, originalPrompt);
      } catch (e) {
        alert('Try again later');
        this.disabled = false;
        this.textContent = 'Fix my prompt';
      }
    };
  }

  // Close overlay
  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  // Add a function to render the improved prompt UI
  function showImprovedPromptUI(improvedPrompt, originalPrefill) {
    if (!overlay) return;
    overlay.innerHTML = `
      <div class="fixmyprompts-modal" style="background:#f6fef9;border:1px solid #d1fae5;box-shadow:0 2px 8px rgba(16,185,129,0.08);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="color:#10b981;font-size:1.3em;">✨</span>
          <span style="font-weight:600;font-size:1.1em;color:#111;">Your Improved Prompt</span>
        </div>
        <div id="fixmyprompts-improved-box" style="background:#fff;border-radius:8px;padding:16px 12px;margin-bottom:18px;font-size:1.05em;border:1px solid #e5e7eb;word-break:break-word;color:#111;">${(improvedPrompt || '').replace(/</g,'&lt;')}</div>
        <div style="display:flex;gap:10px;justify-content:flex-start;margin-bottom:10px;">
          <button id="fixmyprompts-back-btn" style="background:#f3f4f6;border:none;color:#374151;padding:8px 18px;border-radius:8px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;">
            <span style='font-size:1.1em;'>&larr;</span> Go back
          </button>
          <button id="fixmyprompts-copy-btn" style="background:#fff;border:1.5px solid #10b981;color:#10b981;padding:8px 18px;border-radius:8px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;">
            Copy <span style='font-size:1.1em;'>&#128203;</span>
          </button>
        </div>
      </div>
    `;
    overlay.querySelector('#fixmyprompts-copy-btn').onclick = () => {
      navigator.clipboard.writeText(improvedPrompt || '');
      overlay.querySelector('#fixmyprompts-copy-btn').innerHTML = "Copied! <span style='font-size:1.1em;'>&#128203;</span>";
      setTimeout(()=>{
        overlay.querySelector('#fixmyprompts-copy-btn').innerHTML = "Copy <span style='font-size:1.1em;'>&#128203;</span>";
      }, 1200);
    };
    overlay.querySelector('#fixmyprompts-back-btn').onclick = () => {
      closeOverlay();
      showOverlay(originalPrefill);
    };
  }

  // Clean up on navigation (for SPA sites)
  window.addEventListener('popstate', closeOverlay);
  window.addEventListener('hashchange', closeOverlay);

  // Wait for the page to be fully loaded before running.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  document.addEventListener('fmp-insert-placeholder', (e) => {
    if (promptTextarea) {
        const { selectionStart, selectionEnd } = promptTextarea;
        const text = promptTextarea.value || promptTextarea.textContent;
        const newText = text.slice(0, selectionStart) + e.detail + text.slice(selectionEnd);
        promptTextarea.value = newText;
        promptTextarea.focus();
        promptTextarea.selectionStart = promptTextarea.selectionEnd = selectionStart + e.detail.length;
    }
  });

  document.addEventListener('fmp-rewrite-prompt', async () => {
    if (promptTextarea) {
        const originalPrompt = promptTextarea.value || promptTextarea.textContent || '';

        // 1. GUARD CLAUSE: Prevent API call if the prompt is empty.
        if (originalPrompt.trim() === '') {
            alert('Please enter a prompt before asking for a rewrite.');
            return;
        }

        const rewriteBtn = document.getElementById('fmp-sb-rewrite-btn');
        if (rewriteBtn) {
          rewriteBtn.disabled = true;
          rewriteBtn.textContent = 'Rewriting...';
        }
        
        try {
            const resp = await fetch('https://fixmyprompts.com/api/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalPrompt, category: 'General' })
            });
            
            if (!resp.ok) {
              // Throw a more informative error to be caught below
              throw new Error(`API returned status ${resp.status}: ${resp.statusText}`);
            }
            
            const data = await resp.json();
            if (!data.improvedPrompt) {
              throw new Error('API response did not contain an improvedPrompt.');
            }
            
            setNativeValueAndDispatchEvents(promptTextarea, data.improvedPrompt);
            
            // Instead of re-scoring, hide the score card and show a success toast.
            if (scoreCard) {
              scoreCard.classList.remove('visible');
            }
            showToast('✅ Your prompt is improved and ready to go!');

        } catch(e) {
            // 2. IMPROVED LOGGING: Provide detailed info in the console for debugging.
            console.error("FMP Rewrite failed. Details logged below.");
            console.error("Error object:", e);
            console.error("Prompt that was sent:", originalPrompt);
            alert("Sorry, the rewrite failed. Please check the browser console for more details.");
        } finally {
          if (rewriteBtn) {
            rewriteBtn.disabled = false;
            rewriteBtn.textContent = '⚡ One-click rewrite';
          }
        }
    }
  });

  /**
   * Creates and shows a temporary toast notification.
   * @param {string} message The message to display in the toast.
   */
  function showToast(message) {
    let toast = document.getElementById('fmp-toast');
    if (toast) {
      toast.remove(); // Remove existing toast to reset animation
    }
    
    toast = document.createElement('div');
    toast.id = 'fmp-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // The animation is handled by CSS, but we need to remove the element after.
    setTimeout(() => {
      toast.remove();
    }, 3000); // Duration of the animation
  }
})(); 