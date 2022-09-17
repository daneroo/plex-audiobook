# Audiobook metadata validation

## Plan

- [ ] Walk `/archive/media/audiobooks`
  - [x] extract metadata
  - [ ] validate all author/titles: unique, override with hint
  - [ ] lookup on audible -> asin
  - compare total length and get chapters
  - rewrite `.m4b` with tags and chapters (ffmpeg directly)

## TODO

- asin candidates (for known good Authors)
- [ ] Broken duration for 12 directories
- [ ] fix title/author - '// asin lookup results': 'zero!' - 34 left
- [ ] Check for multiple authors... array?
- [ ] Rename in final step Monkey -> Journey to the west...
- [ ] Oscar Wild The picture of Dorian Gray - Read by Edward Petherbridge
- [ ] Merge and rename
  - [x] Rename directories Sean Caroll -> Sean Carroll
  - [x] Merge Brent Weeks Light Bringer
  - [ ] Merge Sean Carroll - The Particle at the End of the Universe/Disc 1-9
  - [ ] Merge Nemesis (Hary Hole 4) discs
  - [ ] Merge StevenPinker-StuffOfThought part 1-2
  - [ ] Merge OrsonScottCard-EndersGame/Disc 1-9
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
    - Cosmere 8 - Elantris 1.5 - The Hope of Elantris - Arcanum Unbounded - Chapter 20-21
  - From Arcanum Unbounded, so we can skip Cosmere [X]
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

- [ ] Lookup asin candidates > newdb.js, except 13 'FIX NOW!' entries
- [ ] rewrite db.js - refactor into sepearate cli
- [ ] validate: output: info,warn,error - or reporting ov validator array
- [ ] make top level index.js (cli.js) a yargs command thing

## Merge workflow


## References

- [Modern Walk (AJ ONeal)](https://therootcompany.com/blog/fs-walk-for-node-js/)
- [Borewit/music-metadata](https://github.com/Borewit/music-metadata)
- [audible-api](https://github.com/book-tools/audible-api)
- [audiobookbay api](https://github.com/ValentinHLica/audiobookbay)
- [Audible API - unofficial docs](https://audible.readthedocs.io/en/latest/misc/external_api.html#products)
- [ID3v2 Chapter spec](https://id3.org/id3v2-chapters-1.0)
- [MDN - media codecs parameter](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter)
- [MDN html5 media repo](https://github.com/mdn/learning-area/tree/main/html/multimedia-and-embedding)
