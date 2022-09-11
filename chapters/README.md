# Audiobook metadata exploration

## Plan

- [ ] Walk `/archive/media/audiobooks`
  - validate: output: info,warn,error
  - extract metadata
  - group by book/album/series
    - split walking directories, and non nested files
  - lookup on audible -> asin
  - compare total length and get chapters
  - rewrite `.m4b` with tags and chapters (ffmpeg directly)

## TODO

Handle these:

```txt
/Volumes/Space/archive/media/audiobooks//The7Habitsof-ectivePeople_4.aa
/Volumes/Space/archive/media/audiobooks//The.Upside.of.Irrationality.m4a
```

## References

- [Modern Walk (AJ ONeal)](https://therootcompany.com/blog/fs-walk-for-node-js/)
- [Borewit/music-metadata](https://github.com/Borewit/music-metadata)
- [audible-api](https://github.com/book-tools/audible-api)
- [audiobookbay api](https://github.com/ValentinHLica/audiobookbay)