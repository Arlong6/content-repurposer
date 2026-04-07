export async function getApiKey(): Promise<string | null> {
  const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
  return geminiApiKey || null;
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ geminiApiKey: key });
}
