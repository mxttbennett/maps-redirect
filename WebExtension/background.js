const RULESET = 'redirects';

async function syncState() {
  let enabled = true;
  try {
    const reply = await browser.runtime.sendNativeMessage('application.id', { type: 'getState' });
    enabled = reply.enabled !== false;
  } catch {}
  await browser.declarativeNetRequest.updateEnabledRulesets(
    enabled ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] }
  );
  return enabled;
}

browser.runtime.onInstalled.addListener(syncState);
browser.runtime.onStartup.addListener(syncState);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getState') {
    syncState().then((enabled) => sendResponse({ enabled }));
    return true;
  }
  if (message.type === 'resolve') {
    fetch(message.url, { redirect: 'follow' })
      .then((response) => sendResponse({ url: response.url }))
      .catch(() => sendResponse({ url: null }));
    return true;
  }
  return false;
});
