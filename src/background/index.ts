// Background service worker
// Currently minimal - will expand with scheduling, auto-posting etc.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Content Repurposer installed');
});
