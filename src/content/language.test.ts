import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isDetectedTargetLanguage, isTextTargetLanguage, normalizeLanguage } from './language.ts';

describe('language detection helpers', () => {
  const detectLanguage = async (text: string) => {
    if (/^[\u4e00-\u9fff\s，。！？]+$/.test(text)) {
      return {
        isReliable: true,
        languages: [{ language: 'zh-CN', percentage: 99 }],
      };
    }

    if (/^[a-zA-Z\s,.!?]+$/.test(text)) {
      return {
        isReliable: true,
        languages: [{ language: 'en-US', percentage: 99 }],
      };
    }

    return {
      isReliable: false,
      languages: [],
    };
  };

  it('detects Chinese text as target language', async () => {
    assert.equal(await isTextTargetLanguage('这是一段中文文本。', 'zh', detectLanguage), true);
  });

  it('detects English text as non-target language when target is Chinese', async () => {
    assert.equal(
      await isTextTargetLanguage('This is an English sentence.', 'zh', detectLanguage),
      false,
    );
  });

  it('detects English text as target language', async () => {
    assert.equal(
      await isTextTargetLanguage('This is an English sentence.', 'en', detectLanguage),
      true,
    );
  });

  it('normalizes regional language codes', () => {
    assert.equal(normalizeLanguage('zh-CN'), 'zh');
    assert.equal(normalizeLanguage('EN-us'), 'en');
  });

  it('returns true when reliable detected language matches target language', () => {
    assert.equal(
      isDetectedTargetLanguage(
        {
          isReliable: true,
          languages: [{ language: 'zh-CN', percentage: 99 }],
        },
        'zh',
      ),
      true,
    );
  });

  it('returns false when detected language differs from target language', () => {
    assert.equal(
      isDetectedTargetLanguage(
        {
          isReliable: true,
          languages: [{ language: 'en', percentage: 99 }],
        },
        'zh',
      ),
      false,
    );
  });

  it('returns false for unreliable detection results', () => {
    assert.equal(
      isDetectedTargetLanguage(
        {
          isReliable: false,
          languages: [{ language: 'zh', percentage: 99 }],
        },
        'zh',
      ),
      false,
    );
  });

  it('returns false when no language is detected', () => {
    assert.equal(
      isDetectedTargetLanguage(
        {
          isReliable: true,
          languages: [],
        },
        'zh',
      ),
      false,
    );
  });

  it('returns false when target language is auto', () => {
    assert.equal(
      isDetectedTargetLanguage(
        {
          isReliable: true,
          languages: [{ language: 'zh', percentage: 99 }],
        },
        'auto',
      ),
      false,
    );
  });
});
