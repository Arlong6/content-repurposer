import { useState, useEffect } from 'preact/hooks';
import { PLATFORMS, type Platform } from '../shared/platforms';
import { repurposeContent, type RepurposeOptions } from '../shared/ai-service';
import { getApiKey, setApiKey } from '../shared/storage';
import { canGenerate, incrementUsage, getRemainingUses, FREE_LIMIT } from '../shared/usage';

const TONES = [
  { id: 'default', label: 'Default' },
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'humorous', label: 'Humorous' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'persuasive', label: 'Persuasive' },
];

const LANGUAGES = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'English', label: 'English' },
  { id: 'Traditional Chinese (繁體中文)', label: '繁體中文' },
  { id: 'Simplified Chinese (简体中文)', label: '简体中文' },
  { id: 'Japanese', label: '日本語' },
  { id: 'Korean', label: '한국어' },
  { id: 'Spanish', label: 'Español' },
];

export function App() {
  const [input, setInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin', 'facebook']);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKeyState] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tone, setTone] = useState('default');
  const [language, setLanguage] = useState('auto');
  const [customInstruction, setCustomInstruction] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [remaining, setRemaining] = useState(FREE_LIMIT);

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) setApiKeyState(key);
      else setShowSettings(true);
    });
    getRemainingUses().then(setRemaining);
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      setError('Please set your Gemini API key first');
      return;
    }

    const allowed = await canGenerate();
    if (!allowed) {
      setError(`Daily limit reached (${FREE_LIMIT} per day). Resets at midnight. Upgrade to Pro for unlimited access.`);
      return;
    }

    setLoading(true);
    setError('');
    setResults({});

    try {
      const platforms = selectedPlatforms.map(
        (id) => PLATFORMS.find((p) => p.id === id)!
      );
      const options: RepurposeOptions = { tone, language, customInstruction };
      const result = await repurposeContent(apiKey, input, platforms, options);
      setResults(result);
      await incrementUsage();
      setRemaining(await getRemainingUses());
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (platformId: string) => {
    if (!input.trim() || !apiKey) return;

    const allowed = await canGenerate();
    if (!allowed) {
      setError(`Daily limit reached (${FREE_LIMIT} per day). Resets at midnight.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const platform = PLATFORMS.find((p) => p.id === platformId)!;
      const options: RepurposeOptions = { tone, language, customInstruction };
      const result = await repurposeContent(apiKey, input, [platform], options);
      setResults((prev) => ({ ...prev, ...result }));
      await incrementUsage();
      setRemaining(await getRemainingUses());
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (platformId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platformId);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleExtractPage = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const url = window.location.href;
          const parts: string[] = [];

          const sel = window.getSelection()?.toString();
          if (sel && sel.length > 10) return sel;

          if (url.includes('youtube.com/watch')) {
            const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer')?.textContent;
            if (title) parts.push(title.trim());
            const desc = document.querySelector('#description-inline-expander .yt-core-attributed-string, #description .content, ytd-text-inline-expander .yt-core-attributed-string');
            if (desc) parts.push(desc.textContent?.trim() || '');
            const channel = document.querySelector('#channel-name a, ytd-channel-name a')?.textContent;
            if (channel) parts.push(`Channel: ${channel.trim()}`);
            if (parts.some(p => p.length > 5)) return parts.filter(Boolean).join('\n\n').slice(0, 3000);
          }

          if (url.includes('x.com') || url.includes('twitter.com')) {
            const tweet = document.querySelector('article [data-testid="tweetText"]');
            if (tweet) return tweet.textContent?.slice(0, 3000) || '';
          }

          if (url.includes('reddit.com')) {
            const title = document.querySelector('h1')?.textContent;
            if (title) parts.push(title.trim());
            const body = document.querySelector('[data-click-id="text"] .md, .post-content, shreddit-post');
            if (body) parts.push(body.textContent?.trim() || '');
            if (parts.some(p => p.length > 5)) return parts.filter(Boolean).join('\n\n').slice(0, 3000);
          }

          const article = document.querySelector('article');
          if (article) return article.innerText.slice(0, 3000);

          const main = document.querySelector('main');
          if (main) return main.innerText.slice(0, 3000);

          const body = document.body.cloneNode(true) as HTMLElement;
          body.querySelectorAll('nav, footer, header, aside, script, style, [role="navigation"], [role="banner"]').forEach(el => el.remove());
          const text = body.innerText.trim().slice(0, 3000);
          return text || null;
        },
      });

      if (result && result.trim().length > 10) {
        setInput(result);
      } else {
        setError('Could not extract useful content from this page. Try selecting text first.');
      }
    } catch {
      setError('Cannot extract content from this page');
    }
  };

  const handleSaveKey = async () => {
    await setApiKey(apiKey);
    setShowSettings(false);
    setError('');
  };

  if (showSettings) {
    return (
      <div class="container">
        <h1>Settings</h1>
        <p class="hint">Enter your Gemini API key to get started. Get one free at <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.</p>
        <input
          type="password"
          class="api-input"
          placeholder="Gemini API Key"
          value={apiKey}
          onInput={(e) => setApiKeyState((e.target as HTMLInputElement).value)}
        />
        <button class="btn btn-primary" onClick={handleSaveKey} disabled={!apiKey.trim()}>
          Save & Start
        </button>
      </div>
    );
  }

  return (
    <div class="container">
      <div class="header">
        <h1>Content Repurposer</h1>
        <div class="header-right">
          <span class={`usage-badge ${remaining === 0 ? 'depleted' : ''}`}>
            {remaining}/{FREE_LIMIT}
          </span>
          <button class="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </div>

      <div class="input-section">
        <textarea
          class="text-input"
          placeholder="Paste your content here, or extract from the current page..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          rows={5}
        />
        <div class="input-footer">
          <span class="char-count">{input.length} chars</span>
          <button class="btn btn-secondary btn-sm" onClick={handleExtractPage}>
            Extract from page
          </button>
        </div>
      </div>

      <div class="controls-row">
        <div class="control-group">
          <label class="label">Tone</label>
          <select class="select" value={tone} onChange={(e) => setTone((e.target as HTMLSelectElement).value)}>
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div class="control-group">
          <label class="label">Language</label>
          <select class="select" value={language} onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button class="btn-link" onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? '▾ Hide' : '▸ Custom instruction'}
      </button>
      {showAdvanced && (
        <textarea
          class="text-input custom-input"
          placeholder='e.g. "Include a CTA" or "Mention our product launch"'
          value={customInstruction}
          onInput={(e) => setCustomInstruction((e.target as HTMLTextAreaElement).value)}
          rows={2}
        />
      )}

      <div class="platforms">
        <p class="label">Platforms</p>
        <div class="platform-chips">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              class={`chip ${selectedPlatforms.includes(p.id) ? 'active' : ''}`}
              onClick={() => togglePlatform(p.id)}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      </div>

      <button
        class="btn btn-primary btn-generate"
        onClick={handleGenerate}
        disabled={loading || !input.trim() || selectedPlatforms.length === 0 || remaining === 0}
      >
        {loading ? 'Generating...' : remaining === 0 ? 'Daily limit reached' : 'Generate'}
      </button>

      {error && <p class="error">{error}</p>}

      {remaining === 0 && (
        <div class="upgrade-banner">
          <p>You've used all {FREE_LIMIT} free generations today.</p>
          <p class="hint">Upgrade to Pro for unlimited access — coming soon!</p>
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div class="results">
          {selectedPlatforms.map((id) => {
            const platform = PLATFORMS.find((p) => p.id === id)!;
            const text = results[id];
            if (!text) return null;
            return (
              <div key={id} class="result-card">
                <div class="result-header">
                  <span>{platform.icon} {platform.name}</span>
                  <span class="result-meta">{text.length} chars</span>
                </div>
                <pre class="result-text">{text}</pre>
                <div class="result-actions">
                  <button class="btn-action" onClick={() => handleCopy(id, text)}>
                    {copied === id ? '✓ Copied' : 'Copy'}
                  </button>
                  <button class="btn-action" onClick={() => handleRegenerate(id)} disabled={loading || remaining === 0}>
                    Regenerate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
