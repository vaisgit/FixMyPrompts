// Browser Extension/sidebar.js
// This module should be injected by content.js

class FMP_Sidebar {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  async init() {
    const sidebarUrl = chrome.runtime.getURL('sidebar.html');
    const response = await fetch(sidebarUrl);
    const html = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);

    this.el = document.getElementById('fmp-sidebar');
    this.overlay = document.getElementById('fmp-sidebar-overlay');
    this.scoreValueEl = document.getElementById('fmp-sb-score-value');
    this.gaugeFgEl = document.getElementById('fmp-sb-gauge-fg');
    this.goodListEl = document.getElementById('fmp-sb-good-list');
    this.badListEl = document.getElementById('fmp-sb-bad-list');
    this.rewriteBtn = document.getElementById('fmp-sb-rewrite-btn');
    this.editBtn = document.getElementById('fmp-sb-edit-btn');
    this.logoEl = this.el.querySelector('.fmp-sb-logo');
    this.logoEl.src = chrome.runtime.getURL('logo.png');

    this.bindEvents();
    this.listenForUpdates();
  }

  bindEvents() {
    this.el.querySelector('.fmp-sb-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());
    this.editBtn.addEventListener('click', () => this.close());
    
    document.addEventListener('fmp-open-sidebar', () => this.open());
    
    // Placeholder insertion
    this.badListEl.addEventListener('click', (e) => {
      const target = e.target.closest('li[data-placeholder]');
      if (target) {
        const placeholder = target.getAttribute('data-placeholder');
        document.dispatchEvent(new CustomEvent('fmp-insert-placeholder', { detail: placeholder }));
        this.close();
      }
    });

    // Feedback
    document.getElementById('fmp-sb-feedback-up').addEventListener('click', () => this.sendFeedback('up'));
    document.getElementById('fmp-sb-feedback-down').addEventListener('click', () => this.sendFeedback('down'));
    
    // Rewrite
    this.rewriteBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('fmp-rewrite-prompt'));
        this.close();
    });
  }

  sendFeedback(value) {
    chrome.storage.local.get('fmpCurrentPromptData', (data) => {
        if (data.fmpCurrentPromptData) {
            chrome.runtime.sendMessage({
                type: 'FEEDBACK',
                value: value,
                score: data.fmpCurrentPromptData.score
            });
        }
    });
  }

  listenForUpdates() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.fmpCurrentPromptData && this.isOpen) {
        this.populate(changes.fmpCurrentPromptData.newValue);
      }
    });
  }

  open() {
    this.isOpen = true;
    this.el.classList.add('visible');
    this.overlay.classList.add('visible');
    chrome.storage.local.get('fmpCurrentPromptData', (data) => {
      if (data.fmpCurrentPromptData) {
        this.populate(data.fmpCurrentPromptData);
      }
    });
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('visible');
    this.overlay.classList.remove('visible');
  }
  
  populate(data) {
    if (!data) return;
    const { score, breakdown, text } = data;
    const len = text ? text.length : 0;

    // Update gauge
    this.scoreValueEl.textContent = score;
    this.updateGauge(score);

    // Populate lists
    this.goodListEl.innerHTML = '';
    this.badListEl.innerHTML = '';

    const dimensionMap = {
        length: { 
            title: "Length",
            bad: `Your prompt is ${len} characters; models work best at 50-250. Trim fluff or add context as needed.`,
            good: "Nice job keeping ${dimension} on point."
        },
        clarity: { 
            title: "Clear action",
            bad: "No decisive verb detected. Start with a verb: ‘Explain’, ‘Compare’, ‘Generate’.",
            good: "Nice job keeping ${dimension} on point."
        },
        specific: { 
            title: "Audience & format",
            bad: "Audience / output style missing. Add: ‘for beginner investors, in a 5-point table’.",
            good: "Nice job keeping ${dimension} on point."
        },
        vague: { 
            title: "Avoid vagueness",
            bad: "Contains fuzzy words like ‘good’. Replace with explicit traits: ‘cost-effective’, ‘three detailed steps’.",
            good: "Nice job keeping ${dimension} on point."
        },
        dup: { 
            title: "No repetition",
            bad: "Repeated word detected (e.g. ‘very very’). Delete duplicates for clarity.",
            good: "Nice job keeping ${dimension} on point."
        },
        variety: { 
            title: "Word variety",
            bad: "Same verb repeated. Swap in synonyms: evaluate, analyse, assess.",
            good: "Nice job keeping ${dimension} on point."
        }
    };

    for (const key in dimensionMap) {
        const item = dimensionMap[key];
        if (breakdown[key] > 0) {
            // Scores are penalties, so > 0 is bad
            this.badListEl.innerHTML += `<li><div class="fmp-item-title">❌ ${item.title}</div><div class="fmp-item-subtext">${item.bad}</div></li>`;
        } else {
            this.goodListEl.innerHTML += `<li><div class="fmp-item-title">✓ ${item.title}</div><div class="fmp-item-subtext">${item.good.replace('${dimension}', key)}</div></li>`;
        }
    }

    // Update buttons
    if (score >= 90) {
      this.rewriteBtn.disabled = true;
      this.rewriteBtn.textContent = '✅ Solid prompt';
      this.editBtn.textContent = 'Close';
    } else {
      this.rewriteBtn.disabled = false;
      this.rewriteBtn.textContent = '⚡ One-click rewrite';
      this.editBtn.textContent = '✍ I’ll edit';
    }
  }

  updateGauge(score) {
    const radius = this.gaugeFgEl.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    this.gaugeFgEl.style.strokeDasharray = `${circumference}`;
    this.gaugeFgEl.style.strokeDashoffset = offset;

    let colorVar;
    if (score > 75) {
      colorVar = '--fmp-sb-accent-green';
    } else if (score > 40) {
      colorVar = '--fmp-sb-accent-amber';
    } else {
      colorVar = '--fmp-sb-accent-red';
    }
    this.gaugeFgEl.style.stroke = `var(${colorVar})`;
  }
}

// Ensure it only runs once
if (typeof window.fmpSidebarInstance === 'undefined') {
  window.fmpSidebarInstance = new FMP_Sidebar();
} 