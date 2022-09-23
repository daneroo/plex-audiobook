# RSS feed for audiobook directory

## TODO

- decide if/where to deploy
- rss feed and audifiles on different domains (tailscale?)

## Usage

```bash
npm ci
npm start
open http://localhost:8879
# public (for public access) - port forwarded before deployed behind caddy
open http://dl.imetrical.com:8879/audiobook/feed.xml
# pocket cast link https://pca.st/private/ebec3590-1d97-013b-05db-0acc26574db2
# subscribed with nojunk on iPhone Xs
```

## References

- [@kentcdodds/podcastify-dir](https://github.com/kentcdodds/podcastify-dir)