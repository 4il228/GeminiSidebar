let _panelTabIds = new Set();
let _activeTabId = null;

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab) _activeTabId = tab.id;
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  _activeTabId = tabId;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  _panelTabIds.delete(tabId);
  if (_activeTabId === tabId) _activeTabId = null;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.set({ sidePanelOpen: false });
});

chrome.sidePanel.onClosed.addListener(() => {
  if (_activeTabId !== null) _panelTabIds.delete(_activeTabId);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-sidepanel" || !_activeTabId) return;

  const tabId = _activeTabId;

  if (_panelTabIds.has(tabId)) {
    _panelTabIds.delete(tabId);
    chrome.sidePanel.close({ tabId }, () => {
      if (chrome.runtime.lastError) {
        // Panel already closed — state already cleaned up above
      }
    });
  } else {
    _panelTabIds.add(tabId);
    chrome.sidePanel.open({ tabId });
  }
});

// Слушатель IPC сообщений от SidePanel для выполнения скриншота
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CAPTURE_ACTIVE_TAB") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl: dataUrl });
      }
    });
    return true;
  }
});
