// content.js
// Injects a floating button and overlay for prompt improvement on supported sites

(function () {
  // Avoid double-injection
  if (window.__fixMyPromptsInjected) return;
  window.__fixMyPromptsInjected = true;

  // Helper: Find the main prompt textarea on each supported site
  function findPromptTextarea() {
    // ChatGPT
    let el = document.querySelector('textarea[data-id="root"]') ||
             document.querySelector('form textarea') ||
             document.querySelector('textarea');
    // Claude
    if (location.hostname.includes('claude.ai')) {
      el = document.querySelector('textarea') || el;
    }
    // Gemini
    if (location.hostname.includes('gemini.google.com')) {
      el = document.querySelector('textarea') || el;
    }
    // Grok
    if (location.hostname.includes('grok.xai.com')) {
      el = document.querySelector('textarea') || el;
    }
    return el;
  }

  // Create floating button with icon
  const button = document.createElement('button');
  button.id = 'fixmyprompts-fab';
  button.title = 'FixMyPrompts: Refine your prompt';
  button.type = 'button';
  // Floating button icon
  const iconUrl = chrome.runtime.getURL('icon48.png');
  // Modal logo
  const logoUrl = chrome.runtime.getURL('logo.png');
  button.innerHTML = `<img src="${iconUrl}" alt="FixMyPrompts" style="width:32px;height:32px;">`;
  document.body.appendChild(button);

  // Overlay elements
  let overlay = null;

  // Show overlay
  function showOverlay(prefillText) {
    if (overlay) return;
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

  // Button click handler
  button.onclick = function () {
    const textarea = findPromptTextarea();
    let prefill = '';
    if (textarea) {
      if (textarea.selectionStart !== undefined && textarea.selectionEnd !== undefined && textarea.selectionStart !== textarea.selectionEnd) {
        prefill = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      } else {
        prefill = textarea.value;
      }
    }
    showOverlay(prefill);
  };

  // Clean up on navigation (for SPA sites)
  window.addEventListener('popstate', closeOverlay);
  window.addEventListener('hashchange', closeOverlay);

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
})(); 