import { config, isOpenAIConfigured } from '../utils/config.js';
import { logger } from '../utils/logger.js';

function hashWord(word: string, index: number): number {
  let value = 0;
  for (const char of word) {
    value += char.charCodeAt(0) * (index + 1);
  }
  return value;
}

function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / magnitude);
}

export async function embedText(text: string): Promise<number[]> {
  if (isOpenAIConfigured()) {
    logger.info('Using mock embedding while OpenAI HTTP integration is pending', {
      model: config.embeddingModel,
    });
  }

  const buckets = new Array(12).fill(0);
  for (const [index, word] of text.toLowerCase().split(/\W+/).filter(Boolean).entries()) {
    buckets[index % buckets.length] += hashWord(word, index);
  }

  return normalize(buckets);
}

export async function answerQuestion(question: string, context: string[]): Promise<string> {
  const joined = context.join(' ').trim();
  if (!joined) {
    return `No indexed context was found for: "${question}".`;
  }

  const summary = joined.slice(0, 400);
  return `Answer generated from indexed knowledge for "${question}": ${summary}`;
}
