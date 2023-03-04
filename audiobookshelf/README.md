# Audiobookshelf

## Dry run

Run in docker on `plex-audiobook.imetrical.com`

The audiobooks folder is mounted from syno (read-only) same as in plex
Mounting the these 3 directories:

- /Volumes/Reading/audiobooks/:/audiobooks:ro
- ./data/metadata:/metadata
- ./data/config:/config

```bash
docker compose up -d
```

## References

- [Audiobookshelf Site](https://www.audiobookshelf.org/)
- [GiiHub](https://github.com/advplyr/audiobookshelf)