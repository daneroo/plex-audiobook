# Audiobook metadata exploration

## Plan

- [ ] Walk `/archive/media/audiobooks`
  - extract metadata
  - group by book/album/series
  - lookup on audible -> asin
  - compare total length and get chapters
  - rewrite `.m4b` with tags and chapters (ffmpeg directly)

## References

- [Modern Walk (AJ ONeal)](https://therootcompany.com/blog/fs-walk-for-node-js/)
- [Borewit/music-metadata](https://github.com/Borewit/music-metadata)
- [audible-api](https://github.com/book-tools/audible-api)