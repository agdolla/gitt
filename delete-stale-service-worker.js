var CACHE_NAME = 'gitt';

function doesRequestAcceptHtml(request) {
  return request.headers.get('Accept')
    .split(',')
    .some(function(type) { return type === 'text/html'; });
};

function cacheOrNetwork(event) {
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      if (response) {
        console.log('from cache', event.request);
        return response;
      }

      var fetchRequest = event.request.clone();
      return fetch(fetchRequest)
      .then(function(response) {
        console.log('from network');
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
    })
  );
};

function validateCache() {
  console.log('validate');
  return Promise.resolve();
}

this.addEventListener('install', function (event) {
  console.log('install');
});

this.addEventListener('activate', function (event) {
  console.log('activate');
});

this.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  var isRootRequest = url.host === self.location.host;

  if (isRootRequest && doesRequestAcceptHtml(request)) {
    return validateCache()
    .then(function() {
      cacheOrNetwork(event)
    });
  }
  else {
    cacheOrNetwork(event);
  }
});
