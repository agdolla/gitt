/* eslint no-console:0 */

// credit where credit's due
// ideas/code from:
// https://www.theguardian.com/service-worker.js
// https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker
// https://github.com/w3c-webmob/ServiceWorkersDemos

var CACHE_NAME = 'gitt';
var VERSIONKEY = 'version';
var CHECKURL = '/update/';

function doesRequestAcceptHtml(request) {
  return request.headers.get('Accept')
    .split(',')
    .some(type => type === 'text/html');
}

function cacheOrNetwork(event) {
  return caches.match(event.request)
  .then(response => {
    console.log(event.request);
    if (response) {
      return response;
    }

    var fetchRequest = event.request.clone();
    return fetch(fetchRequest)
    .then(response => {
      if(!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
      return response;
    });
  });
}

function getCurrentVersion() {
  return caches.match(VERSIONKEY)
  .then(version => {
    if (version === undefined) {
      return 'initial'; // FIXME find something better :)
    }
    return version.json();
  });
}

function setCurrentVersion(version) {
  return caches.open(VERSIONKEY)
  .then(cache => {
    var key = new Request(VERSIONKEY);
    var value = new Response(version);
    return cache.put(key, value);
  });
}

function needToDelete(key, filenames) {
  console.log(key, filenames);
  return filenames && filenames.length ? filenames.some(filename => filename === key) : false;
}

function deleteFiles(filenames) {
  return caches.keys()
  .then(keys => {
    return Promise.all(
      keys.map(key => {
        if (needToDelete(key, filenames)) {
          console.log('deleting', key);
          return caches.delete(key);
        }
      })
    );
  });
}

function validateCache() {
  return new Promise(resolve => {
    getCurrentVersion()
    .then(version => {
      fetch(CHECKURL + version + '.json' + '?'+Math.random())
      .then(response => response.json())
      .then(json => {
        if (version === json.version) {
          return resolve();
        }
        return resolve(Promise.all([deleteFiles(json.modifiedFiles), setCurrentVersion(json.version)]));
      });
    });
  });
}

function handleEvent(event) {
  var request = event.request;
  var url = new URL(request.url);
  var isRootRequest = url.host === self.location.host;
  if (isRootRequest && doesRequestAcceptHtml(request)) {
    return validateCache()
    .then(() => cacheOrNetwork(event));
  }
  else {
    return cacheOrNetwork(event);
  }
}

this.addEventListener('fetch', event => {
  event.respondWith(
    handleEvent(event)
  );
});
