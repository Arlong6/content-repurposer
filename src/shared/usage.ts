const FREE_DAILY_LIMIT = 5;
const STORAGE_KEY = 'usage';

interface UsageData {
  date: string;
  count: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsage(): Promise<UsageData> {
  const { [STORAGE_KEY]: data } = await chrome.storage.local.get(STORAGE_KEY);
  const today = getToday();

  if (!data || data.date !== today) {
    return { date: today, count: 0 };
  }
  return data;
}

export async function incrementUsage(): Promise<void> {
  const usage = await getUsage();
  usage.count += 1;
  await chrome.storage.local.set({ [STORAGE_KEY]: usage });
}

export async function canGenerate(): Promise<boolean> {
  const usage = await getUsage();
  return usage.count < FREE_DAILY_LIMIT;
}

export async function getRemainingUses(): Promise<number> {
  const usage = await getUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

export const FREE_LIMIT = FREE_DAILY_LIMIT;
