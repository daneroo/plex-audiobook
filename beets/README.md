# Tagging with beets-audible

Note: _Installing docker under ubuntu snap restricts mounted volumes to `$HOME` so we replaced the docker snap with this [installation method from Docker Inc](https://docs.docker.com/engine/install/ubuntu/)._

This is a docker based solution from [Neurrone](https://github.com/Neurrone/beets-audible)

We can update the plugin by re-cloning `https://github.com/Neurrone/beets-audible`
into `beets/plugins/audible`

The docker-compose files mounts _working_ directories (in `/Volumes/Space/Beets` for now)

## Process

- [ ] Define these...
  - directories: /Volumes/Space/Beets/{untagged,audiobooks,clean,combined}

beets: `/untagged` -> `/audiobooks` both under `/Volumes/Space/Beets/`

## Notes

```bash
# cleanup - and restart
docker compose down
# mkdir -p BEETSFOLDER/{untagged,audiobooks}
mkdir -p /Volumes/Space/Beets/{untagged,audiobooks}

# startup
docker compose up --build -d
docker exec -it beets bash

## copy in some content
rsync -av --progress /Volumes/Space/archive/media/audiobooks/xx.. /Volumes/Space/Beets/untagged/

# run the tagger on one directory
time beet -vv import /untagged/xx..

# metadata.yml
curl --silent https://api.audnex.us/books/B014LL6R5U | jq
curl --silent https://api.audnex.us/books/B014LL6R5U/chapters | jq
curl --silent https://api.audnex.us/authors/B001JP7WJC | jq
```
