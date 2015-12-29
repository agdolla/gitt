# gitt
this thing needs a better name
(gitt means putty in Hungarian)

tl;dr
Validate your serviceworker cache with one request.

With Service Worker it's possible to manage client side caching with javascript code but it's important to remember:
"There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors."

So we want to cache everything to speed up browsing but we do not want to display stale info.
On the browser side it's not possible to decide if any of the cached resources have become stale so for every single cached resource the browser has to ask the server if the resource is still valid.
This defeats the purpose of caching.

It'd be great if we could validate the cache with a single request so the validation would be cheap. The server has no idea of what resources are in the client cache so the client could send a list but that would be lame.
The idea is to use a version for the cached resource set (like a git commit number, hence the name) and by sending this version info to the server the server can respond with a list of resources that have become stale.
Having the list of stale resources the easiest thing to do is to remove them from the cache. If a resource have become stale because it's no longer needed then by removing it from the cache we can be sure that we purge unneeded resources.
If a resource have become stale because there is a newer version on the server and the resource is indeed needed by the page then later, when the page asks for that resource it won't be in the cache so Service Worker will download it, it'll serve the page and
it'll put the resource to the cache so the cache will contain the latest version.



(Maybe it's an old idea. Maybe it's been debated and thrown away already but I could not find anything about it.)


