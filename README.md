# Plex setup for audiobooks

Remote: <https://audiobook.dl.imetrical.com:443/web>
Local: <http://plex-audiobook.imetrical.com:32400/web>
Local: <http://192.168.86.34:32400/web>

- [x] snapshots on proxmox
- [ ] Check token stuff <https://forums.plex.tv/t/give-custom-server-access-urls-presedence-in-api-resources/274363>
- [ ] NFS mount of Reading share
  - Storage on Synology - use nfs/read-only - auth controlled by synology (by host)
  - [NFS](https://saywebsolutions.com/blog/mounting_synology_nas_shared_folder_nfs_ubuntu_16_10)
- Process for progressive migration /archive/media/audioboos /Reading/audiobooks

- [ ] Run in docker ? what about plugins: later
  - <https://github.com/plexinc/pms-docker>, image at <https://hub.docker.com/r/plexinc/pms-docker/>

## plex-audiobook VM on hilbert

- plex-audiobook.imetrical.com -> 192.168.86.34
  - link/ether 82:a1:71:54:20:4c brd ff:ff:ff:ff:ff:ff
- ubuntu 22.04
- 4 cores/8G/256G
- install docker and plex
- see section below for setting up plexmedia on ubuntu instance
- see my plex token : yM_Bj1FZVLpHt-xs1whp
  - https://plex.tv/api/resources?yM_Bj1FZVLpHt-xs1whp

Adjust Account Setting: Network: Advanced: Custom server access URLs

This is a snapshot of resulting `Preferences.xml`: plex-audiobook on hilbert
i.e. '/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Preferences.xml'

```xml
<?xml version="1.0" encoding="utf-8"?>
<Preferences OldestPreviousVersion="1.28.2.6106-44a5bbd28" MachineIdentifier="67dac0f7-783f-4084-9eba-fce1b8ae120d" ProcessedMachineIdentifier="8977a39088f381a6df1db65db80f6c84fab496af" AnonymousMachineIdentifier="190563f5-8863-4cae-93e4-9a26ca6bb77d" MetricsEpoch="1" GlobalMusicVideoPathMigrated="1" AcceptedEULA="1" PublishServerOnPlexOnlineKey="0" PlexOnlineToken="yM_Bj1FZVLpHt-xs1whp" PlexOnlineUsername="daneroo" PlexOnlineMail="daniel.lauzon@gmail.com" DvrIncrementalEpgLoader="0" CertificateUUID="381d0e80f81a447cb1c0d21cb381894b" PubSubServer="172.105.13.59" PubSubServerRegion="yyz" PubSubServerPing="1067312801" CertificateVersion="3" CloudSyncNeedsUpdate="0" LanguageInCloud="1" customConnections="https://audiobook.dl.imetrical.com:443/, http://plex-audiobook.imetrical.com:32400/, http://192.168.86.34:32400/"/>
```

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
# ~plex == /var/lib/plexmediaserver
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
- [plex in docker](https://github.com/plexinc/pms-docker)
- [plex on ubuntu](https://linuxize.com/post/how-to-install-plex-media-server-on-ubuntu-20-04/)
- [Audnexus](https://github.com/djdembeck/Audnexus.bundle)
- [mutagen-inspect](https://mutagen.readthedocs.io/en/latest/man/mutagen-inspect.html)
- [auto-m4b](https://registry.hub.docker.com/r/seanap/auto-m4b/)
- [beets tagging](https://github.com/Neurrone/beets-audible)
  - [seanap's fork](https://github.com/seanap/beets-audible)
- [xirg's mp3tag](https://github.com/Xirg/docker-mp3tag)
- [BragiBooks](https://github.com/djdembeck/bragibooks)
- [audio tagging in Go](https://github.com/dhowden/tag)
- [m4b-tool](https://github.com/sandreas/m4b-tool)
  - []()
