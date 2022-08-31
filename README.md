# Plex setup for audiobooks

- Plex server: <http://192.168.86.34:32400/web>
- [ ] Should/could move to synology (+gateway?)
- Plan
  - Is it useful - install bookcamp with on deck
  - examples of untagged to tagged directory
    - repeatable processes - over the fence
  - survey of tools
- [audio tagging in Go](https://github.com/dhowden/tag)

## plex-audiobook VM on hilbert

- plex-audiobook: 192.168.86.34
- ubuntu 22.04
- 4 cores/8G/256G
- docker and plex

## Tagging

Tagging (or re-tagging) is done with [Beets](`./beets/README.md)

It was inspired by [Sneaspap's Guide](https://github.com/seanap/Plex-Audiobook-Guide), but we could'n get mp3tag to work, so we are using beets for now

## with Go

```bash
cd mywalker
time go run cmd/walk/main.go -path ../beets-audible/beets/data/untagged/
```

## m4b-tool

```bash
alias m4b-tool='docker run -it --rm -u $(id -u):$(id -g) -v "$(pwd)":/mnt sandreas/m4b-tool:latest'
```

## Install Audnexus

```bash
cd ~plex/Library/Application\ Support/Plex\ Media\ Server/Plug-ins
sudo git clone https://github.com/djdembeck/Audnexus.bundle.git
sudo chown -R plex: Audnexus.bundle

sudo systemctl restart plexmediaserver
```

### Create an audiobook library

- From within Plex Web, create a new library, with the MUSIC type, and name it **Audiobooks**.
- Add your folders.

In the ADVANCED tab:

- Scanner: `Plex Music Scanner`
- Agent: `Audnexus Agent`
- Toggle agent settings as you please.
- Uncheck all boxes except `Store track progress`
- Genres: `Embedded tags`
- Album Art: `Local Files Only`

Add the library and go do anything but read a physical book while the magic happens :)

## Install plex in ubuntu

Try on plex-audiobook@hilbert (192.168.86.34)

```bash
curl https://downloads.plex.tv/plex-keys/PlexSign.key | sudo apt-key add -
echo deb https://downloads.plex.tv/repo/deb public main | sudo tee /etc/apt/sources.list.d/plexmediaserver.list

sudo apt update
sudo apt install plexmediaserver

# check plex is running
sudo systemctl status plexmediaserver

# add content
sudo mkdir -p /opt/plexmedia/audiobooks  # {movies,series}
sudo chown -R plex: /opt/plexmedia
```

## References

- [Guide](https://github.com/seanap/Plex-Audiobook-Guide?utm_source=pocket_mylist#players)
- [plex on ubuntu](https://linuxize.com/post/how-to-install-plex-media-server-on-ubuntu-20-04/)
- [Audnexus](https://github.com/djdembeck/Audnexus.bundle)
- [auto-m4b](https://registry.hub.docker.com/r/seanap/auto-m4b/)
- [beets tagging](https://github.com/Neurrone/beets-audible)
  - [seanap's fork](https://github.com/seanap/beets-audible)
- [xirg's mp3tag](https://github.com/Xirg/docker-mp3tag)
- [BragiBooks](https://github.com/djdembeck/bragibooks)
- [audio tagging in Go](https://github.com/dhowden/tag)
- [m4b-tool](https://github.com/sandreas/m4b-tool)
  - []()
