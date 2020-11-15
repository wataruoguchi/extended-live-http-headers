const version = "1.3";
chrome.browserAction.onClicked.addListener(onClicked);

function onClicked(tab: chrome.tabs.Tab): void {
  chrome.debugger.attach(
    { tabId: tab.id },
    version,
    onAttach.bind(null, tab.id)
  );
}

function onAttach(tabId: number | undefined): void {
  if (typeof tabId === "undefined") return;
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }
  chrome.windows.create({
    url: "headers.html?" + tabId,
    type: "normal",
  });
}
