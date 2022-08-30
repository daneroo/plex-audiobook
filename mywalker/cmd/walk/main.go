// Copyright 2015, David Howden
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
The check tool performs tag lookups on full music collections (iTunes or directory tree of files).
*/
package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/dhowden/tag"
)

var (
	path = flag.String("path", "", "path to directory containing audio files")
	sum  = flag.Bool("sum", false, "compute the checksum of the audio file (doesn't work for .flac or .ogg yet)")
)

func main() {
	flag.Parse()

	if *path == "" {
		fmt.Println("you must specify -path")
		flag.Usage()
		os.Exit(1)
	}

	var paths <-chan string

	if *path != "" {
		paths = walkPath(*path)
	}

	p := &processor{
		decodingErrors: make(map[string]int),
		hashErrors:     make(map[string]int),
		hashes:         make(map[string]int),
	}

	done := make(chan bool)
	go func() {
		p.do(paths)
		fmt.Println(".. and now the errors")
		fmt.Println(p)
		close(done)
	}()
	<-done
}

func walkPath(root string) <-chan string {
	ch := make(chan string)
	fn := func(path string, info os.FileInfo, err error) error {
		// fmt.Printf("Walking: %s / %s\n",path, info.Name())
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		ch <- path
		return nil
	}

	go func() {
		err := filepath.Walk(root, fn)
		if err != nil {
			fmt.Println(err)
		}
		close(ch)
	}()
	return ch
}

type processor struct {
	decodingErrors map[string]int
	hashErrors     map[string]int
	hashes         map[string]int
}

func (p *processor) String() string {
	result := ""
	for k, v := range p.decodingErrors {
		result += fmt.Sprintf("DE: %v : %v\n", k, v)
	}

	for k, v := range p.hashErrors {
		result += fmt.Sprintf("HE: %v : %v\n", k, v)
	}

	for k, v := range p.hashes {
		if v > 1 {
			result += fmt.Sprintf("H>1: %v : %v\n", k, v)
		}
	}
	return result
}

func (p *processor) do(ch <-chan string) {
	for path := range ch {
		func() {
			defer func() {
				if p := recover(); p != nil {
					fmt.Printf("Panicing at: %v", path)
					panic(p)
				}
			}()
			// fmt.Printf("Doing: %s \n", path)
			tf, err := os.Open(path)
			if err != nil {
				p.decodingErrors["error opening file"]++
				return
			}
			defer tf.Close()

			_, _, err = tag.Identify(tf)
			if err != nil {
				// fmt.Println("IDENTIFY:", path, err.Error())
				// Not really a decoding error is it?
				p.decodingErrors[err.Error()]++
			}

			m, err2 := tag.ReadFrom(tf)
			if err2 != nil {
				// fmt.Println("READFROM:", path, err2.Error())
				p.decodingErrors[err2.Error()]++
			} else {
				printMetadata(m)
			}

			if *sum {
				_, err = tf.Seek(0, io.SeekStart)
				if err != nil {
					// fmt.Println("DIED:", path, "error seeking back to 0:", err)
					return
				}

				h, err := tag.Sum(tf)
				if err != nil {
					// fmt.Println("SUM:", path, err.Error())
					p.hashErrors[err.Error()]++
				} else {
					fmt.Printf("Did: %s : %s\n", path, h)
					p.hashes[h]++
				}
			} else {
				fmt.Printf("Did: %s\n", path)
			}
		}()
	}
}

func printMetadata(m tag.Metadata) {
	fmt.Printf("Metadata Format: %v\n", m.Format())
	fmt.Printf("File Type: %v\n", m.FileType())

	fmt.Printf(" Title: %v\n", m.Title())
	fmt.Printf(" Album: %v\n", m.Album())
	fmt.Printf(" Artist: %v\n", m.Artist())
	// fmt.Printf(" Composer: %v\n", m.Composer())
	// fmt.Printf(" Genre: %v\n", m.Genre())
	// fmt.Printf(" Year: %v\n", m.Year())

	// track, trackCount := m.Track()
	// fmt.Printf(" Track: %v of %v\n", track, trackCount)

	// disc, discCount := m.Disc()
	// fmt.Printf(" Disc: %v of %v\n", disc, discCount)

	// fmt.Printf(" Picture: %v\n", m.Picture())
	// fmt.Printf(" Lyrics: %v\n", m.Lyrics())
	// fmt.Printf(" Comment: %v\n", m.Comment())
}
