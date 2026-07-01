async function checkActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const isOnGemini = tab.url && tab.url.startsWith("https://gemini.google.com");

  document.getElementById('info-message').classList.toggle('hidden', !isOnGemini);
  document.getElementById('gemini-frame').style.display = isOnGemini ? 'none' : '';
  document.getElementById('capture-btn').style.display = isOnGemini ? 'none' : '';
}

document.addEventListener('DOMContentLoaded', checkActiveTab);
chrome.tabs.onActivated.addListener(checkActiveTab);

document.getElementById('capture-btn').addEventListener('click', async () => {
  const btn = document.getElementById('capture-btn');
  btn.classList.add('loading');

  // Шаг 1: Запрос скриншота активной вкладки у Background Service Worker
  chrome.runtime.sendMessage({ action: "CAPTURE_ACTIVE_TAB" }, (response) => {
    btn.classList.remove('loading');
    
    if (response && response.success) {
      // Шаг 2: Передача base64-строки во внутренний контентный скрипт iframe
      const iframe = document.getElementById('gemini-frame');
      iframe.contentWindow.postMessage({
        type: "INJECT_SCREENSHOT",
        dataUrl: response.dataUrl
      }, "https://gemini.google.com");
    } else {
      console.error("Ошибка захвата экрана:", response ? response.error : "Unknown error");
    }
  });
});
