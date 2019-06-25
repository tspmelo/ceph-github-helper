let timeout = undefined;
const events = ['onCompleted', 'onHistoryStateUpdated', 'onDOMContentLoaded'];
const hostFilter = {
  url: [{ urlContains: 'https://github.com/ceph/ceph/pull/' }]
};

events.forEach((event) => {
  browser.webNavigation[event].addListener(function(data) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      chrome.tabs.sendMessage(data.tabId, data.url);
    }, 1000);
  }, hostFilter);
});
