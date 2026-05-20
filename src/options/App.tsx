import { useEffect, useState } from 'react';
import type { ExtensionSettings, TranslatorName } from '../shared/types';
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '../shared/storage';

const LANGUAGES = [
  { value: 'auto', label: '自动检测' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'es', label: '西班牙语' },
];

const TRANSLATOR_LABELS: Record<TranslatorName, string> = {
  google: 'Google Translate',
  youdao: '有道翻译',
  openai: 'OpenAI 兼容大模型',
};

const TRANSLATOR_DESCRIPTIONS: Record<TranslatorName, string> = {
  google: '适合通用文本翻译，需要 Google Cloud Translation API Key。',
  youdao: '适合中英互译场景，需要有道智云 appKey 和 appSecret。',
  openai: '通过 openai-sdk 调用 OpenAI 或兼容提供商，支持自定义系统提示词。',
};

function moveItem(items: TranslatorName[], index: number, direction: -1 | 1): TranslatorName[] {
  const next = [...items];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function TextInput({
  label,
  value,
  type = 'text',
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: 'text' | 'password';
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: typeof LANGUAGES;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showSecrets, setShowSecrets] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  const updateSource = <T extends TranslatorName>(
    source: T,
    values: Partial<ExtensionSettings['sources'][T]>,
  ) => {
    setSettings((current) => ({
      ...current,
      sources: {
        ...current.sources,
        [source]: {
          ...current.sources[source],
          ...values,
        },
      },
    }));
  };

  const toggleTranslator = (name: TranslatorName, enabled: boolean) => {
    setSettings((current) => {
      const without = current.fallbackChain.filter((item) => item !== name);
      return {
        ...current,
        fallbackChain: enabled ? [...without, name] : without,
      };
    });
  };

  const onSave = async () => {
    setMessage('');
    if (!settings.targetLang) {
      setMessage('请选择目标语言');
      return;
    }
    if (settings.fallbackChain.length === 0) {
      setMessage('请至少启用一个翻译源');
      return;
    }

    setSaving(true);
    try {
      await saveSettings(settings);
      setMessage('设置已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-blue-200">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              Selection Translator
            </p>
            <h1 className="text-3xl font-bold tracking-tight">划词翻译设置</h1>
            <p className="mt-3 text-sm leading-6 text-blue-50">
              配置翻译服务、语言偏好和回退顺序。
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">翻译服务密钥</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    填写至少一个可用服务；回退链会按右侧顺序依次尝试。
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(event) => setShowSecrets(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  显示密钥
                </label>
              </div>

              <div className="grid gap-5">
                <TextInput
                  label="Google API Key"
                  type={showSecrets ? 'text' : 'password'}
                  value={settings.sources.google.apiKey}
                  placeholder="AIza..."
                  onChange={(apiKey) => updateSource('google', { apiKey })}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    label="有道 appKey"
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.sources.youdao.appKey}
                    placeholder="输入有道 appKey"
                    onChange={(appKey) => updateSource('youdao', { appKey })}
                  />
                  <TextInput
                    label="有道 appSecret"
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.sources.youdao.appSecret}
                    placeholder="输入有道 appSecret"
                    onChange={(appSecret) => updateSource('youdao', { appSecret })}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">OpenAI 兼容大模型</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      label="API Key"
                      type={showSecrets ? 'text' : 'password'}
                      value={settings.sources.openai.apiKey}
                      placeholder="sk-..."
                      onChange={(apiKey) => updateSource('openai', { apiKey })}
                    />
                    <TextInput
                      label="模型"
                      value={settings.sources.openai.model}
                      placeholder="gpt-4o-mini"
                      onChange={(model) => updateSource('openai', { model })}
                    />
                  </div>
                  <div className="mt-5">
                    <TextInput
                      label="Base URL（可填写兼容 OpenAI 的提供商地址）"
                      value={settings.sources.openai.baseUrl}
                      placeholder="https://api.openai.com/v1"
                      onChange={(baseUrl) => updateSource('openai', { baseUrl })}
                    />
                  </div>
                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      系统提示词
                    </span>
                    <textarea
                      value={settings.sources.openai.systemPrompt}
                      placeholder="输入系统提示词"
                      onChange={(event) =>
                        updateSource('openai', { systemPrompt: event.target.value })
                      }
                      rows={5}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">语言偏好</h2>
              <p className="mt-1 text-sm text-slate-500">源语言通常建议保持自动检测。</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <SelectInput
                  label="源语言"
                  value={settings.sourceLang}
                  options={LANGUAGES}
                  onChange={(sourceLang) => setSettings({ ...settings, sourceLang })}
                />
                <SelectInput
                  label="目标语言"
                  value={settings.targetLang}
                  options={LANGUAGES.filter((language) => language.value !== 'auto')}
                  onChange={(targetLang) => setSettings({ ...settings, targetLang })}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">回退链</h2>
              <p className="mt-1 text-sm text-slate-500">启用并调整翻译源优先级。</p>

              <div className="mt-5 space-y-3">
                {(Object.keys(TRANSLATOR_LABELS) as TranslatorName[]).map((name) => {
                  const index = settings.fallbackChain.indexOf(name);
                  const enabled = index >= 0;
                  return (
                    <div
                      key={name}
                      className={`rounded-2xl border p-4 transition ${
                        enabled ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => toggleTranslator(name, event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {TRANSLATOR_LABELS[name]}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {TRANSLATOR_DESCRIPTIONS[name]}
                            </span>
                          </span>
                        </label>
                        {enabled ? (
                          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                            #{index + 1}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={!enabled || index === 0}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              fallbackChain: moveItem(settings.fallbackChain, index, -1),
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          上移
                        </button>
                        <button
                          type="button"
                          disabled={!enabled || index === settings.fallbackChain.length - 1}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              fallbackChain: moveItem(settings.fallbackChain, index, 1),
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          下移
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">保存配置</h2>
              <p className="mt-1 text-sm text-slate-500">保存后，下一次划词翻译会使用最新配置。</p>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
              {message ? (
                <p
                  className={`mt-4 rounded-xl px-4 py-3 text-sm ${message === '设置已保存' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                >
                  {message}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
