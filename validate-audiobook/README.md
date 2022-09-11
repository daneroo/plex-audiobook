# Audiobook metadata validation

## Plan

- [ ] Walk `/archive/media/audiobooks`
  - [x] extract metadata
  - [ ] lookup on audible -> asin
  - compare total length and get chapters
  - rewrite `.m4b` with tags and chapters (ffmpeg directly)

## TODO

- validate: output: info,warn,error - or reporting ov validator array
- make top level index.js (cli.js) a yargs command thing

## References

- [Modern Walk (AJ ONeal)](https://therootcompany.com/blog/fs-walk-for-node-js/)
- [Borewit/music-metadata](https://github.com/Borewit/music-metadata)
- [audible-api](https://github.com/book-tools/audible-api)
- [audiobookbay api](https://github.com/ValentinHLica/audiobookbay)
- [Audible API - unoffilac docs](https://audible.readthedocs.io/en/latest/misc/external_api.html#products)
