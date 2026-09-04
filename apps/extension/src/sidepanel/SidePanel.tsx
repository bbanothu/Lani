import { useEffect, useState, type FormEvent } from 'react';
import {
  LLMSettings,
  CapturedProduct,
  getSettings,
  saveSettings,
  getOutbox,
  clearOutbox,
  isPaused,
  setPaused,
} from '../lib/storage';

const PROVIDER_LABELS: Record<LLMSettings['provider'], string> = {
  claude: 'Claude',
  openrouter: 'OpenRouter',
  ollama: 'Ollama (local)',
};

const DEFAULT_MODELS: Record<LLMSettings['provider'], string> = {
  claude: 'claude-sonnet-5',
  openrouter: '',
  ollama: 'llama3.1',
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

type Tab = 'captured' | 'ai';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function sendMessage<T = any>(message: object): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

function AuthGate({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await sendMessage<{ ok: boolean; error?: string }>(
      mode === 'signup'
        ? { type: 'authSignUp', email, password, name }
        : { type: 'authSignIn', email, password },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Something went wrong');
      return;
    }
    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
      return;
    }
    const { user } = await sendMessage<{ ok: boolean; user: AuthUser | null }>({
      type: 'authGetUser',
    });
    if (user) onSignedIn(user);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-10 gap-6">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="" className="w-12 h-12 rounded-md" />
        <span className="font-bold text-ink tracking-tight text-2xl">Lani</span>
      </div>
      <form onSubmit={handleSubmit} className="w-full space-y-2.5">
        {mode === 'signup' && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => {
          setError('');
          setMode(mode === 'signin' ? 'signup' : 'signin');
        }}
        className="text-xs font-medium text-ink/50 hover:text-ink"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
      <p className="text-[11px] text-ink/30 text-center">
        Sign in to start capturing products -- Lani won't watch any page until you do.
      </p>
    </div>
  );
}

function fetchOllamaModels(
  baseUrl: string,
): Promise<{ ok: true; models: string[] } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'listOllamaModels', baseUrl }, resolve);
  });
}

export default function SidePanel() {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('captured');
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [captured, setCaptured] = useState<CapturedProduct[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaModelsError, setOllamaModelsError] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [paused, setPausedState] = useState(false);

  const handleTogglePause = async () => {
    const next = !paused;
    await setPaused(next);
    setPausedState(next);
  };

  const refreshOllamaModels = async (baseUrl: string) => {
    setLoadingModels(true);
    setOllamaModelsError('');
    const result = await fetchOllamaModels(baseUrl);
    if (result.ok) {
      setOllamaModels(result.models);
    } else {
      setOllamaModels([]);
      setOllamaModelsError(result.error || 'Could not reach Ollama');
    }
    setLoadingModels(false);
  };

  useEffect(() => {
    getSettings().then((s) => {
      // Claude has no model field in the UI -- always run the pinned default,
      // in case an earlier build left another provider's model in place.
      const fixed = s.provider === 'claude' ? { ...s, model: DEFAULT_MODELS.claude } : s;
      setSettings(fixed);
      if (fixed.provider === 'ollama') {
        refreshOllamaModels(fixed.ollamaBaseUrl || 'http://localhost:11434/v1');
      }
    });
    isPaused().then(setPausedState);
    getOutbox().then(setCaptured);
    const refreshAuth = () =>
      sendMessage<{ ok: boolean; user: AuthUser | null }>({ type: 'authGetUser' }).then((res) =>
        setAuthUser(res.ok ? res.user : null),
      );
    refreshAuth();
    const interval = setInterval(() => {
      getOutbox().then(setCaptured);
      refreshAuth();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await sendMessage({ type: 'authSignOut' });
    setAuthUser(null);
  };

  const handleProviderChange = (provider: LLMSettings['provider']) => {
    setSettings((prev) => ({
      provider,
      apiKey: prev?.apiKey || '',
      model: DEFAULT_MODELS[provider],
      ollamaBaseUrl: prev?.ollamaBaseUrl || 'http://localhost:11434/v1',
    }));
    if (provider === 'ollama') {
      refreshOllamaModels(settings?.ollamaBaseUrl || 'http://localhost:11434/v1');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    await saveSettings({
      ...settings,
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
    });
    setSaveStatus('Settings saved.');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleClearCaptured = async () => {
    await clearOutbox();
    setCaptured([]);
  };

  if (authUser === undefined || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authUser === null) {
    return <AuthGate onSignedIn={setAuthUser} />;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex items-center gap-4 px-5 py-8 border-b border-ink/10 bg-white/60 backdrop-blur-sm">
        <img src="/icon.png" alt="" className="w-14 h-14 rounded-md" />
        <div className="flex flex-col">
          <span className="font-bold text-ink tracking-tight text-2xl leading-tight">Lani</span>
          <span className="text-[11px] text-ink/40 truncate max-w-[140px]">{authUser.email}</span>
        </div>
        <span className="ml-auto flex items-center gap-3 text-sm text-ink/50">
          <span
            className={`w-4 h-4 rounded-full ${paused ? 'bg-ink/30' : 'bg-green-500 animate-pulse'}`}
          />
          {paused ? 'paused' : 'watching'}
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-ink/40 hover:text-red-500"
          >
            Sign out
          </button>
        </span>
      </header>

      <nav className="px-5 pt-4">
        <div className="flex rounded-full border border-ink/10 bg-white p-1 text-sm shadow-sm">
          {(
            [
              ['captured', `Captured (${captured.length})`],
              ['ai', 'AI'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-full font-medium transition-colors text-xs ${
                tab === key ? 'bg-brand text-white shadow-sm' : 'text-ink/50 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-5 py-5 space-y-3 overflow-y-auto">
        {tab === 'captured' && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-ink/40">Last {captured.length} captured</p>
              {captured.length > 0 && (
                <button
                  onClick={handleClearCaptured}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            {captured.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 text-center text-sm text-ink/50">
                Nothing captured yet -- browse to a shopping site and this will fill up.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm divide-y divide-ink/5">
                {captured.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-ink/5 overflow-hidden shrink-0">
                      {p.image && (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{p.title}</p>
                      <p className="text-[11px] text-ink/40 truncate">
                        {p.domain} · {timeAgo(p.capturedAt)}
                        {p.synced ? '' : ' · syncing…'}
                      </p>
                      {p.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-ink/50 bg-ink/5 rounded-full px-1.5 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {p.price != null && (
                      <span className="text-xs font-semibold text-brand shrink-0">
                        {p.currency}
                        {p.price}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'ai' && (
          <>
            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink text-sm">
                  {paused ? 'Detection paused' : 'Detection running'}
                </h2>
                <p className="text-xs text-ink/50 mt-0.5">
                  {paused
                    ? 'Not checking any pages right now.'
                    : 'Checking pages you visit for products.'}
                </p>
              </div>
              <button
                onClick={handleTogglePause}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  paused
                    ? 'bg-brand text-white hover:bg-brand-dark'
                    : 'bg-ink/10 text-ink hover:bg-ink/15'
                }`}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  AI Provider
                </label>
                <div className="flex flex-wrap gap-1 rounded-xl border border-ink/10 bg-ink/[0.03] p-1">
                  {(Object.keys(PROVIDER_LABELS) as LLMSettings['provider'][]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        settings.provider === p
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-ink/50 hover:text-ink'
                      }`}
                    >
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {settings.provider !== 'ollama' && (
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder={`Your ${PROVIDER_LABELS[settings.provider]} API key`}
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                  />
                </div>
              )}

              {settings.provider === 'ollama' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-ink/70">
                      Ollama server URL
                    </label>
                    <button
                      onClick={() =>
                        refreshOllamaModels(settings.ollamaBaseUrl || 'http://localhost:11434/v1')
                      }
                      className="text-xs text-brand hover:text-brand-dark font-medium"
                    >
                      {loadingModels ? 'Checking...' : 'Refresh models'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.ollamaBaseUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ollamaBaseUrl: e.target.value,
                      })
                    }
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                  />
                  {ollamaModelsError && (
                    <p className="text-xs text-red-500 mt-1">{ollamaModelsError}</p>
                  )}
                </div>
              )}

              {settings.provider !== 'claude' && (
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">Model</label>
                  {settings.provider === 'ollama' && ollamaModels.length > 0 ? (
                    <select
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                      className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow bg-white"
                    >
                      {!ollamaModels.includes(settings.model) && (
                        <option value={settings.model}>{settings.model}</option>
                      )}
                      {ollamaModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                      placeholder={
                        settings.provider === 'openrouter'
                          ? 'e.g. anthropic/claude-sonnet-5'
                          : 'e.g. llama3.1'
                      }
                      className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                    />
                  )}
                  {settings.provider === 'ollama' &&
                    ollamaModels.length === 0 &&
                    !loadingModels &&
                    !ollamaModelsError && (
                      <p className="text-xs text-ink/40 mt-1">
                        Couldn't list installed models -- typing one in manually.
                      </p>
                    )}
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                Save Settings
              </button>
              {saveStatus && <p className="text-xs text-green-600 text-center">{saveStatus}</p>}
            </div>
          </>
        )}
      </main>

      <footer className="px-5 py-3 text-center text-[11px] text-ink/30">
        Everything stays on your device 🐾
      </footer>
    </div>
  );
}
