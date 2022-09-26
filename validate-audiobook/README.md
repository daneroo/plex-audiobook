# Audiobook metadata validation

## Plan

- [ ] Validate `/archive/media/audiobooks`
  - [x] extract metadata
  - [x] validate all author/titles: unique, override with hint
  - [x] lookup on audible -> asin
  - compare total length and get chapters
  - rewrite `.m4b` with tags and chapters (ffmpeg directly)
- Add `TXXX=mod_time=<file modification time>` id3v2 tags to track download date
- Validation data structure
  - [directoryPath]: // per directory
    - verifyExtensionsAllAccountedFor
    - no audio files
    - no metadata for all/any?
    - author/title - from metadata or hint
      - if not unique or truthy, require hint
    - total duration - or error (from metadata parser)
    - skip reasons:  'multiple authors', 'not on audible'
    - asin - with hint or lookup (author title) (possibly narrator)
- [PocketCasts instead of BookCamp?](https://github.com/kentcdodds/podcastify-dir)

## TODO

- [x] Quick and dirty convert
  - multiple mp3 files, chapters from files
- [ ] compare tags with
  - [ ] ffprobe -of json -show_format -show_chapters Helgoland.mp3  2>/dev/null
  - `/Applications/OpenAudible.app/Contents/Resources/app/bin/mac/ffprobe`
  - `docker run --rm -it --entrypoint ffprobe jrottenberg/ffmpeg:4.4-ubuntu -version`
  - also `mid3v2 -l file.mp3
  - also `mid3v2 --list-raw file.mp3 : raw python data format
- [ ] remove minutes/seconds from duration
- [ ] asin candidates (for known good Authors) - rewrite ordered, threshold filtered list
- Validator: no unaccounted:
  - [ ] find 7 habits `.aa` file
  - Import Steven R. Covey - The 7 Habits of Highly Effective People
  - Import PKF A SCanner Darkly
- QA with matching narrator (for asin lookup,..)
- [ ] Check for multiple authors... array?
- [ ] Rename in final step Monkey -> Journey to the west...
- [ ] Oscar Wild The picture of Dorian Gray - Read by Edward Petherbridge
- [ ] skip:
  - [ ] skip: "not on audible"  // when we know for sure (cory/Lessig,..)
    - [ ] Doris Lessing - Shikasta
    - [ ] IsaacAsimov-RobotSeries/1982 - The Complete Robot
    - [ ] Jim Butcher - The Dresden Files/Dresden Files y.x shorts
    - [ ] Jorge Luis Borges - The Aleph and Other Stories
  - [ ] skip: "found in Arcanum": Delete extraneous Cosmere - from Arcanum Unbounded
    - Cosmere 10 - Sixth of the Dusk - Arcanum Unbounded - Chapter 64-66
    - Cosmere 12 - Mistborn 4.5 - Allomancer Jak and the Pits of Eltania - Arcanum Unbounded - Chapter 25-26
    - Cosmere 19 - The Stormlight Archive 2.5 - Edgedancer - Arcanum Unbounded - Chapter 68-88
    - Cosmere 23-25 - White Sand 1-3 - Volume 1-3 - Arcanum Unbounded - Chapter 54,55-57
    - Cosmere 4 - Mistborn 3.4 - The Eleventh Metal - Arcanum Unbounded - Chapter 23-24
    - Cosmere 5 - Mistborn 3.5 - Secret History - Arcanum Unbounded - Chapter 27-53
    - Cosmere 7 - Elantris 1.4 - The Emperor's Soul" - Arcanum Unbounded - Chapter 3-19
  - From Arcanum Unbounded, so we can skip Cosmere [X]
    - Cosmere 8 - Elantris 1.5 - The Hope of Elantris - Arcanum Unbounded - Chapter 20-21
    - [--] Arcanum Unbounded - The Cosmere Collection 1 - Chapter 1 - Preface.mp3
    - [--] Arcanum Unbounded - The Cosmere Collection 2 - Chapter 2 - The Selish System.mp3
    - [C7] Arcanum Unbounded - The Cosmere Collection 3 - Chapter 3-19 - The Emperor's Soul.mp3
    - [C8] Arcanum Unbounded - The Cosmere Collection 4 - Chapter 20-21 - The Hope of Elantris.mp3
    - [--] Arcanum Unbounded - The Cosmere Collection 5 - Chapter 22 - The Scadrian System.mp3
    - [C4] Arcanum Unbounded - The Cosmere Collection 6 - Chapter 23-24 - The Eleventh Metal.mp3
    - [C12] Arcanum Unbounded - The Cosmere Collection 7 - Chapter 25-26 - Allomancer Jack and the Pits of Eltania.mp3
    - [C5] Arcanum Unbounded - The Cosmere Collection 8 - Chapter 27-53 - Mistborn - Secret History.mp3
    - [C23-25] Arcanum Unbounded - The Cosmere Collection 9 - Chapter 54 - The Taldian System.mp3
    - [C23-25] Arcanum Unbounded - The Cosmere Collection 10 - Chapter 55-57 - White Sand.mp3
    - [C9] Arcanum Unbounded - The Cosmere Collection 11 - Chapter 58 - The Threnodite System.mp3
    - [C9] Arcanum Unbounded - The Cosmere Collection 12 - Chapter 59-62 - Shadows for Silence in the Forest of Hell.mp3
    - [C10] Arcanum Unbounded - The Cosmere Collection 13 - Chapter 63 - The Drominad System.mp3
    - [C10] Arcanum Unbounded - The Cosmere Collection 14 - Chapter 64-66 - Sixth of the Dusk.mp3
    - [C19] Arcanum Unbounded - The Cosmere Collection 15 - Chapter 67 - The Rosharan System.mp3
    - [C19] Arcanum Unbounded - The Cosmere Collection 16 - Chapter 68-88 - Edgedancer.mp3
- Sort order for multiple audio file concatenation - use [natural sort](https://github.com/snovakovic/fast-sort)
- [ ] Lookup asin candidates > newdb.js, except 13 'FIX NOW!' entries
- [ ] rewrite db.js - refactor into separate cli
- [ ] validate: output: info,warn,error - or reporting ov validator array
- [ ] make top level index.js (cli.js) a yargs command thing

## ffmpeg docker timing

```bash
# Native for comparison
$ hyperfine "/Applications/OpenAudible.app/Contents/Resources/app/bin/mac/ffprobe -of json -show_format -show_chapters ./mp3/Helgoland.mp3"
Benchmark 1: /Applications/OpenAudible.app/Contents/Resources/app/bin/mac/ffprobe -of json -show_format -show_chapters ./mp3/Helgoland.mp3
  Time (mean ± σ):      69.2 ms ±  42.5 ms    [User: 50.8 ms, System: 10.1 ms]
  Range (min … max):    58.3 ms … 328.7 ms    40 runs

$ hyperfine "docker run --rm -t --entrypoint '' -v $(pwd)/mp3/Helgoland.mp3:/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/file 2>/dev/null'"
Benchmark 1: docker run --rm -t --entrypoint '' -v /Users/daniel/Library/OpenAudible/mp3/Helgoland.mp3:/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/file 2>/dev/null'
  Time (mean ± σ):      1.344 s ±  0.218 s    [User: 0.090 s, System: 0.047 s]
  Range (min … max):    0.918 s …  1.600 s    10 runs

docker run --rm -t --name fff -d --entrypoint '' -v $(pwd)/mp3/Helgoland.mp3:/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'sleep 3600'
$ hyperfine "docker exec fff ffprobe -of json -show_format -show_chapters /audio/file"
Benchmark 1: docker exec fff ffprobe -of json -show_format -show_chapters /audio/file
  Time (mean ± σ):     385.8 ms ±  53.8 ms    [User: 88.3 ms, System: 51.1 ms]
  Range (min … max):   312.5 ms … 479.2 ms    10 runs

```

## ffprobe/mpeg in docker

The default entrypoint for the `jrottenberg/ffmpeg` docker image is `ffmpeg`, but we can use it to run `ffprobe` as well.
In fact it might be easier to use bash as entrypoint, to manipulate stdout/stderr

```bash
# mount a directory
docker run --rm -t --entrypoint '' -v $(pwd):/audio:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/mp3/Hero\ of\ Two\ Worlds.mp3 2>/dev/null' | jq .format.duration

# mount single file
docker run --rm -t --entrypoint '' -v $(pwd)/mp3/Hero\ of\ Two\ Worlds.mp3:/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/file 2>/dev/null' | jq .format.duration

for i in mp3/*.mp3; do echo $i; docker run --rm --entrypoint '' -v "$(pwd)/$i":/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/file 2>/dev/null' | jq .format.duration; done

```

## Merge workflow

```bash

for i in $(seq 1 2); do 
  echo  "inside  Part ${i}"
  (cd Part${i} && for m in *.mp3; do 
    mv "$m" "../CD${i}-${m}"; 
  done)
done

```

### OpenAudible encoding quality

| quality             | size (MB) |
|---------------------|----------:|
| m4b                 |      8727 |
| mp3/Highest         |     11988 |
| **mp3/Recommended** |      7412 |

### ffmpeg and chapters

The metadata file is formatted like the results of ffprobe. The numbers refer to the input files in the order they're entered (so 0 is audio, 1 is metadata in this example). FFMPEG throws a fit if you try to output to the same file you're reading from, so outputFile.mp3 can be renamed once the process finishes.

```bash
ffmpeg -i <audio file> \
-f ffmetadata -i <metadata file> \
-map 0:a \ # use sound from audio file
-map 0:v \ # use album artwork from audio file
-map\_chapters 1 \ # use chapters from metadata file
-map\_metadata 1 \ # use metadata from metadata file
outputFile.mp3
```

## References

- [Modern Walk (AJ ONeal)](https://therootcompany.com/blog/fs-walk-for-node-js/)
- [Borewit/music-metadata](https://github.com/Borewit/music-metadata)
- [audible-api](https://github.com/book-tools/audible-api)
- [audiobookbay api](https://github.com/ValentinHLica/audiobookbay)
- [Audible API - unofficial docs](https://audible.readthedocs.io/en/latest/misc/external_api.html#products)
- [ID3v2 Chapter spec](https://id3.org/id3v2-chapters-1.0)
- [MDN - media codecs parameter](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter)
- [MDN html5 media repo](https://github.com/mdn/learning-area/tree/main/html/multimedia-and-embedding)
- [mutagen-inspect](https://mutagen.readthedocs.io/en/latest/man/mutagen-inspect.html)
- [midv3 (mutagen based)](https://mutagen.readthedocs.io/en/latest/man/mid3v2.html)
- [Ex Falso /Quodlibet/operon](https://quodlibet.readthedocs.io/en/latest/guide/commands/exfalso.html)
- [operon (part of quidlibet.ex falso)](https://quodlibet.readthedocs.io/en/latest/guide/commands/operon.html)
- [docker ffmpeg](https://github.com/jrottenberg/ffmpeg)
- [ffmpeg chapters](https://ikyle.me/blog/2020/add-mp4-chapters-ffmpeg)
- [ffmpeg concat](https://trac.ffmpeg.org/wiki/Concatenate)
  - [Example use](https://www.reddit.com/r/ffmpeg/comments/nyfx7a/is_there_a_correct_way_to_write_chapters_to_a_mp3/)
- [Natural Sort](https://github.com/snovakovic/fast-sort)
- [ffmeta - ffmpeg metadata serialization](https://github.com/FedericoCarboni/ffmeta)