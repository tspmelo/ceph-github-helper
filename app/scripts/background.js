chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
  if (request.contentScriptQuery == 'githubmap') {
    var url = 'https://raw.githubusercontent.com/ceph/ceph/master/.githubmap';
    fetch(url)
      .then((response) => response.text())
      .then((map) => sendResponse(map))
      .catch();
    return true; // Will respond asynchronously.
  }
});
