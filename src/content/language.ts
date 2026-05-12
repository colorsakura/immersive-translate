export interface DetectedLanguage {
  language: string;
  percentage: number;
}

export interface LanguageDetectionResult {
  isReliable: boolean;
  languages: DetectedLanguage[];
}

export function normalizeLanguage(lang: string): string {
  return lang.toLowerCase().split('-')[0];
}

export type DetectLanguage = (text: string) => Promise<LanguageDetectionResult>;

export function isDetectedTargetLanguage(
  detection: LanguageDetectionResult,
  targetLang: string,
): boolean {
  const normalizedTargetLang = normalizeLanguage(targetLang);
  const detectedLanguage = detection.languages[0];

  return (
    normalizedTargetLang !== 'auto' &&
    detection.isReliable &&
    detectedLanguage !== undefined &&
    normalizeLanguage(detectedLanguage.language) === normalizedTargetLang
  );
}

export async function isTextTargetLanguage(
  text: string,
  targetLang: string,
  detectLanguage: DetectLanguage,
): Promise<boolean> {
  try {
    const detection = await detectLanguage(text);
    return isDetectedTargetLanguage(detection, targetLang);
  } catch {
    return false;
  }
}
