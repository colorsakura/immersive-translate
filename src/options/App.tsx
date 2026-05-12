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
  google: 'Google',
  youdao: '有道',
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

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showSecrets, setShowSecrets] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  const updateSource = <T extends TranslatorName>(source: T, values: Partial<ExtensionSettings['sources'][T]>) => {
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

    try {
      await saveSettings(settings);
      setMessage('已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: '32px auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>划词翻译设置</h1>

      <section style={{ display: 'grid', gap: 12 }}>
        <label>
          Google API Key
          <input
            type={showSecrets ? 'text' : 'password'}
            value={settings.sources.google.apiKey}
            onChange={(event) => updateSource('google', { apiKey: event.target.value })}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
          />
        </label>

        <label>
          有道 appKey
          <input
            type={showSecrets ? 'text' : 'password'}
            value={settings.sources.youdao.appKey}
            onChange={(event) => updateSource('youdao', { appKey: event.target.value })}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
          />
        </label>

        <label>
          有道 appSecret
          <input
            type={showSecrets ? 'text' : 'password'}
            value={settings.sources.youdao.appSecret}
            onChange={(event) => updateSource('youdao', { appSecret: event.target.value })}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
          />
        </label>

        <label>
          <input type="checkbox" checked={showSecrets} onChange={(event) => setShowSecrets(event.target.checked)} /> 显示密钥
        </label>

        <label>
          源语言
          <select value={settings.sourceLang} onChange={(event) => setSettings({ ...settings, sourceLang: event.target.value })}>
            {LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </select>
        </label>

        <label>
          目标语言
          <select value={settings.targetLang} onChange={(event) => setSettings({ ...settings, targetLang: event.target.value })}>
            {LANGUAGES.filter((language) => language.value !== 'auto').map((language) => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>回退链</h2>
        {(Object.keys(TRANSLATOR_LABELS) as TranslatorName[]).map((name) => {
          const index = settings.fallbackChain.indexOf(name);
          const enabled = index >= 0;
          return (
            <div key={name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ minWidth: 120 }}>
                <input type="checkbox" checked={enabled} onChange={(event) => toggleTranslator(name, event.target.checked)} /> {TRANSLATOR_LABELS[name]}
              </label>
              <button type="button" disabled={!enabled || index === 0} onClick={() => setSettings({ ...settings, fallbackChain: moveItem(settings.fallbackChain, index, -1) })}>上移</button>
              <button type="button" disabled={!enabled || index === settings.fallbackChain.length - 1} onClick={() => setSettings({ ...settings, fallbackChain: moveItem(settings.fallbackChain, index, 1) })}>下移</button>
            </div>
          );
        })}
      </section>

      <button type="button" onClick={onSave} style={{ marginTop: 16 }}>保存</button>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
