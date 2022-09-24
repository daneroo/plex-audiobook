# ffmpeg for concatenating audio files

## Questions:

- what is `-safe 0`

### ffmpeg and chapters

Note: *Not sure where this is from*

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

## Concatenate nultiple mp3 files into a single mp3 file

```bash
# copilot says
ffmpeg -f concat -safe 0 -i <(for f in *.mp3; do echo "file '$PWD/$f'"; done) -c copy output.mp3
# preserving tags and chapters
ffmpeg -f concat -safe 0 -i <(for f in *.mp3; do echo "file '$PWD/$f'"; done) -c copy -map_metadata 0 -map_chapters 0 output.mp3
# external chapters
ffmpeg -f concat -safe 0 -i <(for f in *.mp3; do echo "file '$PWD/$f'"; done) -i chapters.txt -c copy -map_metadata 0 -map_chapters 1 output.mp3
```

## showing metadata with ffprobe

```bash
# format+chapters
ffprobe -v quiet -print_format json -show_format -show_chapters output.mp3
# with streams
ffprobe -v quiet -print_format json -show_format -show_streams -show_chapters output.mp3
```

## adding chapter marks

From *Adam Becker - What Is Real*

```bash
ffmpeg -i output.mp3 -i chapters.txt -map_metadata 0 -map_chapters 1 -c copy output-chapters.mp3
```

```txt chapters.txt
# Chapter for asin:B078P2MS47 metadata from:
#  https://api.audnex.us/books/B078P2MS47/chapters
## total-duration:: 11:45:10.983 - 42310983ms - 42311s
00:00:00.000 Introduction
00:18:40.177 Prologue
00:22:07.485 Part I. Great Teams Know Their Pulse
00:22:53.708 1. The Measure Of All Things
00:41:29.179 2. Something Rotten In The Eigenstate Of Denmark
01:35:08.115 3. Street Brawl
02:18:20.809 4. Copenhagen In Manhattan
03:23:45.631 Part II. Great Teams Spread Culture
03:24:15.119 5. Physics In Exile
04:32:00.098 6. It Came From Another World!
05:26:44.096 7. The Most Profound Discovery Of Science
06:18:40.539 8. More Things In Heaven And Earth
07:31:13.537 Part III. Culture Permeates The Employee Life Cycle
07:31:39.710 9. Reality Underground
08:37:43.190 10. Quantum Spring
09:34:58.350 11. Copenhagen Versus The Universe
10:34:12.025 12. Outrageous Fortune
11:31:48.780 Appendix
```

## m4b-tool

Try with m4b-tool

```bash

alias m4b-tool='docker run --name m4b -it --rm -u $(id -u):$(id -g) -v /Volumes:/Volumes sandreas/m4b-tool:latest'

# This uses chapters.txt if it is the source directory 
# [YES] confirmed - Trial-1
time m4b-tool merge --output-file /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real.mp3 /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real/*.mp3
# 895.350s
time m4b-tool merge -vvv --no-cleanup --output-file /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real.mp3 /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real/*.mp3

# Trial 4
time m4b-tool merge -vvv --no-conversion --use-filenames-as-chapters  --output-file /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real.mp3 /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real/*.mp3
# 62.314s

#Trial 5 remove chapter.txt from src dir
time m4b-tool merge -vvv --no-conversion --use-filenames-as-chapters  --output-file /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real.mp3 /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real/*.mp3



docker exec -it m4b ash

ls /Volumes/Space/Beets/m4b-tool/Adam\ Becker\ -\ What\ Is\ Real/
total 690032
38984 01. The Measure of All Things.mp3                      64104 05. Physics in Exile.mp3                               62464 09. Reality Underground.mp3                            27384 Adam Becker - What Is Real.epub
50424 02. Something Rotten in the Eigenstate of Denmark.mp3  51440 06. It Came from Another World!.mp3                    53800 10. Quantum Spring.mp3                                   120 Adam Becker - What Is Real.jpg
40640 03. Street Brawl.mp3                                   48824 07. The Most Profound Discovery of Science.mp3         55656 11. Copenhagen Versus the Universe.mp3                     8 chapters.txt
61448 04. Copenhagen in Manhattan.mp3                        68144 08. More Things in Heaven and Earth.mp3                66592 12. Outrageous Fortune.mp3


```

```txt output
This for each mp3
ffmpeg -nostats -loglevel panic -hide_banner -i /Volumes/Space/Beets/m4b-tool/Adam Becker - What Is Real/10. Quantum Spring.mp3 -map_metadata 0 -max_muxing_queue_size 9999 -movflags +faststart -vn -ab 64k -ar 22050 -ac 0 -acodec libmp3lame -f mp3 /tmp/m4b-tool/10-conve

ffmpeg -nostats -loglevel panic -hide_banner -f concat -safe 0 -vn -i /tmp/m4b-tool/tmp_Adam Becker - What Is Real.mp3.listing.txt -max_muxing_queue_size 9999 -c copy -f mp3 /tmp/m4b-tool/tmp_Adam Becker - What Is Real.mp3
ffmpeg -nostats -loglevel panic -hide_banner -f concat -safe 0 -vn -i /tmp/m4b-tool/tmp_Adam Becker - What Is Real.mp3.listing.txt -max_muxing_queue_size 9999 -c copy -f mp3 /tmp/m4b-tool/tmp_Adam Becker - What Is Real.mp3

ffmpeg -nostats -loglevel panic -hide_banner -i /tmp/m4b-tool/tmp_Adam Becker - What Is Real.mp3 -i /Volumes/Space/Beets/m4b-tool/Adam Becker - What Is Real/Adam Becker - What Is Real.jpg -i /tmp/NgkdgC.txt -map_metadata 2 -map 0:0 -map 1:0 -c copy /tmp/m4b-tool/tmp_Ad