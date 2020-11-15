type url = string;
type responseBody = {
  body: string;
  base64Encoded: boolean;
};

let gAttached: boolean = false;
let gRequests: url[] = [];
// Objects to help connecting URL and response body.
let gObjects: { url: url; requestId: string }[] = [];

const tabId: number = parseInt(window.location.search.substring(1));

let requests: { [id: number]: HTMLDivElement } = {};

async function sendCommand(message: string, params?): Promise<object | null> {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, message, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

async function onEvent(
  debuggeeId: chrome.debugger.Debuggee,
  message: string,
  params?: Object | undefined
): Promise<void> {
  if (tabId !== debuggeeId.tabId) {
    return;
  }
  if (!params) {
    return;
  }
  // request ID. Every event here should have the ID.
  const requestId = params["requestId"] || -1;

  switch (message) {
    case "Network.requestWillBeSent": {
      const url = params["request"].url;

      if (url) {
        let requestDiv: HTMLDivElement = requests[requestId];

        if (!requestDiv) {
          // Build a checkbox.
          const hiddenCheckbox: HTMLInputElement = document.createElement(
            "input"
          );
          hiddenCheckbox.id = `toggle-${requestId}`;
          hiddenCheckbox.setAttribute("type", "checkbox");

          // Build a div for the URL.
          const urlLine: HTMLLabelElement = document.createElement("label");
          urlLine.className = "url toggle";
          urlLine.setAttribute("for", `toggle-${requestId}`);
          urlLine.textContent = url;

          // Build a div for the request body.
          requestDiv = document.createElement("div");
          requestDiv.id = requestId;
          requestDiv.className = "request";
          requestDiv.appendChild(hiddenCheckbox);
          requestDiv.appendChild(urlLine);

          requests[requestId] = requestDiv;
          gRequests.push(url);
        }

        if (params["redirectResponse"]) {
          appendResponse(requestId, params["redirectResponse"]);
        }

        // Add content
        const requestLine: HTMLDivElement = document.createElement("div");
        requestLine.className = "request-details";
        requestLine.textContent =
          "\n" +
          params["request"].method +
          " " +
          parseURL(url).path +
          " HTTP/1.1";
        requestDiv.appendChild(requestLine);

        // Adding the request div to the body.
        document.getElementById("container")?.appendChild(requestDiv);
      } else {
        // Unmatched URLs.
      }
      break;
    }
    case "Network.responseReceived": {
      const url = params["response"].url;
      if (url) {
        // Response header.
        appendResponse(requestId, params["response"]);
        gObjects.push({
          requestId,
          url,
        });
      }
      break;
    }
    case "Network.loadingFinished": {
      if (gObjects.length) {
        try {
          let idx = -1;
          const [obj] = gObjects.filter((gObject) => {
            ++idx;
            return gObject.requestId === requestId;
          });
          if (obj && idx >= 0) {
            gObjects.splice(idx, 1)[0];
          } else {
            return;
          }

          gRequests.splice(gRequests.indexOf(obj.url), 1);
          if (obj.url) {
            const result = await sendCommand("Network.getResponseBody", {
              requestId,
            });
            if (!result) return;
            const _result: responseBody = result as responseBody;
            appendResponseBody(requestId, _result);
          }
        } catch (err) {
          console.log(err);
        }
      }
      break;
    }
  }
  return;
}

/**
 * Update the 'request' div by adding header info.
 * @param requestId
 * @param response
 */
function appendResponse(
  requestId: string,
  response: {
    requestHeaders: object;
    status: string;
    statusText: string;
    headers: object;
  }
): void {
  const requestDiv: HTMLDivElement = requests[requestId];
  if (response.requestHeaders)
    requestDiv.appendChild(formatHeaders(response.requestHeaders));
  const statusLine: HTMLDivElement = document.createElement("div");
  statusLine.className = "request-details";
  statusLine.textContent =
    "\nHTTP/1.1 " + response.status + " " + response.statusText;
  if (statusLine) requestDiv.appendChild(statusLine);
  if (response.headers) requestDiv.appendChild(formatHeaders(response.headers));
  return;
}
/**
 * Update the `request' div by adding the response body.
 * @param requestId
 * @param response
 */
function appendResponseBody(
  requestId: string,
  response: { base64Encoded: boolean; body: string }
): void {
  const requestDiv: HTMLDivElement = requests[requestId];
  if (response.body) {
    const responseBodyDiv: HTMLDivElement = document.createElement("div");
    responseBodyDiv.className = "response-body";
    const responseBodyDebugDiv: HTMLDivElement = document.createElement("div");
    responseBodyDebugDiv.className = "response-body-debug";
    const { body } = response;
    try {
      const isJson = JSON.parse(body);
      responseBodyDiv.textContent = JSON.stringify(isJson, null, 4);
      responseBodyDebugDiv.textContent = JSON.stringify(isJson, null, 4);
    } catch (err) {
      responseBodyDiv.textContent = response.body;
    }
    requestDiv.appendChild(responseBodyDiv);
    requestDiv.appendChild(responseBodyDebugDiv);
  }
  return;
}

function formatHeaders(headers: object): HTMLDivElement {
  let text: string = "";
  for (const name in headers) {
    text += name + ": " + headers[name] + "\n";
  }
  const div: HTMLDivElement = document.createElement("div");
  div.className = "request-details headers";
  div.textContent = text;
  return div;
}

function parseURL(
  url: string
): {
  schema: string;
  host: string;
  port: string;
  path: string;
  fragment: string;
} {
  const result = { schema: "", host: "", port: "", path: "", fragment: "" };
  const match = url.match(
    /^([^:]+):\/\/([^\/:]*)(?::([\d]+))?(?:(\/[^#]*)(?:#(.*))?)?$/i
  );
  if (!match) {
    return result;
  }
  result.schema = match[1].toLowerCase();
  result.host = match[2];
  result.port = match[3];
  result.path = match[4] || "/";
  result.fragment = match[5];
  return result;
}

window.addEventListener("load", async function () {
  console.log("loaded");
  await sendCommand("Network.enable");
  console.log("network enabled");
  if (gAttached) return;
  chrome.debugger.onEvent.addListener(onEvent);
  gAttached = true;
  return;
});

window.addEventListener("unload", function () {
  console.log("unloaded");
  chrome.debugger.detach({ tabId });
  return;
});
