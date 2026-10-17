(async () => {
  if (window.top !== window) return;
  let enabled = true;
  try {
    ({ enabled } = await browser.runtime.sendMessage({ type: 'getState' }));
  } catch {}
  if (!enabled) return;
  const resolve = async (url) => {
    try {
      return (await browser.runtime.sendMessage({ type: 'resolve', url })).url;
    } catch {
      return null;
    }
  };
  startRedirector({ resolve, pageScheme: 'https' });
})();
