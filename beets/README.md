# Tagging with beets-audible

This is a docker based solution from [Neurrone](https://github.com/Neurrone/beets-audible)

We can update the plugin by re-cloning `https://github.com/Neurrone/beets-audible`
into `beets/plugins/audible`

The docker-compose files mounts _working_ directories (in `/Volumes/Space/Beets` for now)

```bash
# cleanup - and restart
docker-compose rm --stop --force
# mkdir -p BEETSFOLDER/{untagged,audiobooks}
mkdir -p /Volumes/Space/Beets/{untagged,audiobooks}
rm config/library.db

# startup
docker-compose up -d
docker exec -it beets bash

## copy in some content
rsync -av --progress /Volumes/Space/archive/media/audiobooks/Joe\ Abercrombie\ -\ The\ First\ Law\ Trilogy /Volumes/Space/Beets/clean/

# run the tagger
# on one directory
time beet -vv import /untagged/Joe\ Abercrombie\ -\ The\ First\ Law\ Trilogy/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ The\ Blade\ Itself/
# on one directory with asin
time beet -vv import -S B014LL6R5U /untagged/Joe\ Abercrombie\ -\ The\ First\ Law\ Trilogy/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ The\ Blade\ Itself/

# asin files in dirs - remove metadata.yml
find /untagged/Joe\ Abercrombie\ -\ The\ First\ Law\ Trilogy -name \*.asin -print0 | while read -d $'\0' asinfile; do
  echo '##' dir: $(dirname "$asinfile") searchID: $(basename "$asinfile" .asin)
  echo time beet -vv import -S \""$(basename "$asinfile" .asin)"\" \""$(dirname "$asinfile")"\"
done

# Sherlock: B06X93XQRZ
rsync -av --progress /Volumes/Space/archive/media/audiobooks/Arthur\ Conan\ Doyle\ -\ Sherlock\ Holmes\ The\ Definitive\ Audio\ Collection data/untagged/
time beet -vv import -S B06X93XQRZ /untagged/Arthur\ Conan\ Doyle\ -\ Sherlock\ Holmes\ The\ Definitive\ Audio\ Collection/

# metadata.yml
curl --silent https://api.audnex.us/books/B014LL6R5U | jq
# curl --silent https://api.audnex.us/books/B014LL6R5U/chapters | jq
curl --silent https://api.audnex.us/authors/B001JP7WJC | jq
```
