# Plex setup for audiobooks

- Plex server: <http://192.168.86.34:32400/web>

## plex-audiobook VM on hilbert

- plex-audiobook: 192.168.86.34
- ubuntu 22.04
- 4 cores/8G/256G
- docker and plex

## Tagging with bragibooks

```bash
# all in ~/audiobooks (for now)
docker run --rm --name bragibooks -v $(pwd)/untagged:/input -v $(pwd)/untagged:/output -v $(pwd)/config:/config -p 8000:8000/tcp -e LOG_LEVEL=WARNING -e UID=1000 -e GID=1000 ghcr.io/djdembeck/bragibooks:main

# open web page at http://192.168.86.26:8000/
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
- [BragiBooks](https://github.com/djdembeck/bragibooks)
