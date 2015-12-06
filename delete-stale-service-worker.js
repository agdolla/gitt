
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
    .some(function(type) { return type === 'text/html'; });
};

function cacheOrNetwork(event) {
  return caches.match(event.request)
  .then(function(response) {
    console.log(event.request);
    if (response) {
      return response;
    }

    var fetchRequest = event.request.clone();
    return fetch(fetchRequest)
    .then(function(response) {
      if(!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      var responseToCache = response.clone();

      caches.open(CACHE_NAME)
      .then(function(cache) {
        cache.put(event.request, responseToCache);
      });
      return response;
    });
  });
};

function getCurrentVersion() {
  return caches.match(VERSIONKEY)
  .then(function(version) {
    if (version === undefined) {
      return 'initial'; // FIXME find something better :)
    }
    return version.json();
  });
}

function setCurrentVersion(version) {
  return caches.open(VERSIONKEY)
  .then(function(cache) {
    var key = new Request(VERSIONKEY);
    var value = new Response(version);
    return cache.put(key, value);
  });
}

function needToDelete(key, filenames) {
  console.log(key, filenames);
  return filenames && filenames.length ? filenames.some(function(filename) { return filename === key; }) : false;
}

function deleteFiles(filenames) {
  return caches.keys()
  .then(function(keys) {
    return Promise.all(
      keys.map(function(key) {
        if (needToDelete(key, filenames)) {
          console.log('deleting', key);
          return caches.delete(key);
        }
      })
    );
  });
};

function validateCache() {
  return new Promise(function(resolve) {
    getCurrentVersion()
    .then(function(version) {
      fetch(CHECKURL + version + '.json' + '?'+Math.random())
      .then(function(response) { return response.json() })
      .then(function(json) {
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
    .then(function() {
      return cacheOrNetwork(event)
    });
  }
  else {
    return cacheOrNetwork(event);
  }
}

this.addEventListener('fetch', function (event) {
  event.respondWith(
    handleEvent(event)
  );
});
