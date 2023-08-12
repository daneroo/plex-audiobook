# Plex setup for audiobooks

_Note_: as of 2023-08-12 I reinstalled plexmediaserver on this host, by restoring to the 2023-07-16 snapshot.
_Note_: as of 2023-07-17 I uninstalled plexmediaserver on this host, and will rebuild audiobookshelf on a new server (NixOS)

**Audiobookshelf** is running in the plex-audio vm in proxmox@hilbert.

Pixel 6 Download folder is `/audiobooks` (as a Download folder), the app also can see DropSynFiles (used for Smart AudioBook Player)

- Remote: Not yet, not ever
- Tailscale: not yet: <http://plex-audiobook.ts.imetrical.com:13378/>
- Local: <http://plex-audiobook.imetrical.com:13378/>
- Local: <http://192.168.86.34:13378/web>

Plex server WAS (is) running in the plex-audio vm in proxmox@hilbert.

- Remote: <https://audiobook.dl.imetrical.com:443/web>
- Local: <http://plex-audiobook.imetrical.com:32400/web>
- Local: <http://192.168.86.34:32400/web>

## TODO

- [ ] Archive this repo
- [ ] Move to nx-audiobook - including audiobookshelf
  - [ ] Move audiobookshelf permanent to new NuxOS server
- [ ] remove plex stuff, BookCamp 2.0 is never gonna happen...
- [ ] finalize move to nx-audiobook
  - Check Plan and TODO in `validate-audiobook:README.md`
  - remove `validate-audiobook` from this repo
- [x] snapshots on proxmox
- [ ] compare metadata (node.js - music-metadata)
- [ ] canonical folder layout for process
- [ ] Check token stuff <https://forums.plex.tv/t/give-custom-server-access-urls-presedence-in-api-resources/274363>
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
  - <https://plex.tv/api/resources?yM_Bj1FZVLpHt-xs1whp>

Adjust Account Setting: Network: Advanced: Custom server access URLs:
to `http://plex-audiobook.imetrical.com:32400/, http://192.168.86.34:32400/"`.

Could re-add <https://audiobook.dl.imetrical.com:443/> which is still mapped in gateway
Could later add a tailscale address.

This is a snapshot of resulting `Preferences.xml`: plex-audiobook on hilbert
i.e. '/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Preferences.xml'

```xml
<?xml version="1.0" encoding="utf-8"?>
<Preferences OldestPreviousVersion="1.32.5.7349-8f4248874" MachineIdentifier="27d0d69e-7851-4f42-8d87-1f7deb109e43" ProcessedMachineIdentifier="e59a3c2ab3611dc8357e15fd578e338e80bd16c5" Anonymou
sMachineIdentifier="bc131371-e5ba-4d1a-a870-7aa0398d0bf6" MetricsEpoch="1" GlobalMusicVideoPathMigrated="1" AcceptedEULA="1" PublishServerOnPlexOnlineKey="0" PlexOnlineToken="kPMGnjpG-d79e2r3sJw
w" PlexOnlineUsername="daneroo" PlexOnlineMail="daniel.lauzon@gmail.com" DvrIncrementalEpgLoader="0" CertificateUUID="01ff2c859a654348bbac1b4dfd3cd435" PubSubServer="172.105.13.59" PubSubServerR
egion="yyz" PubSubServerPing="40" CertificateVersion="3" LanguageInCloud="1" customConnections="http://plex-audiobook.imetrical.com:32400/, http://192.168.86.34:32400/&quot;"/>
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
# from Volumes/Space/Beets
alias m4b-tool='docker run -it --rm -u $(id -u):$(id -g) -v "$(pwd)":/mnt sandreas/m4b-tool:latest'
# e.g.
m4b-tool split --audio-format mp3 Scott\ Lynch\ -\ The\ Republic\ of\ Thieves.m4b
# get real chapters - from api.audnex.us

time m4b-tool merge --output-file=rechaptered/output.m4b input.m4b
time m4b-tool merge --output-file=rechaptered/1\ -\ The\ Phoenix\ Guards/1\ -\ The\ Phoenix\ Guards.m4b 1\ -\ The\ Phoenix\ Guards/
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
```

## for more local development

```bash
# install ffmpeg (and ffprobe)
sudo apt install ffmpeg
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install --lts
```

### Remote (SMB) content

This is how we mount some content with CIFS/SMB from synology

```bash
sudo apt update
sudo apt install cifs-utils

# Add this user (plex-audiobook) to synology, with read-only access to Share(s)
sudo nano /etc/synology-cifs-credentials
# password: echo -n sekret|sha1sum
# username=plex-audiobook
# password=a1b9892611956aa13a5ab9ccf01f49662583f2d2
sudo chmod 400 /etc/synology-cifs-credentials

sudo mkdir -p /Volumes/Reading
#  to test
sudo mount -t cifs -o ro,vers=3.0,credentials=/etc/synology-cifs-credentials //syno.imetrical.com/Reading /Volumes/Reading
sudo umount /Volumes/Reading

# to make permanent and append:
sudo nano /etc/fstab
# //syno.imetrical.com/Reading /Volumes/Reading cifs ro,vers=3.0,credentials=/etc/synology-cifs-credentials
sudo mount -a

# Draw the rest of the Owl: set paths inside plex...
```

### Also mounting /Archive (temporarily)

```bash
mkdir -p /Volumes/Space/archive
# This will prompt for password
sudo mount -t cifs -o ro,vers=3.0,user=daniel //syno.imetrical.com/Archive /Volumes/Space/archive
```

### Local content

This is where we might put a local (to the ubuntu instance)

```bash
# add content
sudo mkdir -p /opt/plexmedia/audiobooks  # {movies,series}
sudo chown -R plex: /opt/plexmedia
```

## References

- [Guide](https://github.com/seanap/Plex-Audiobook-Guide?utm_source=pocket_mylist#players)
- [plex in docker](https://github.com/plexinc/pms-docker)
- [plex on ubuntu](https://linuxize.com/post/how-to-install-plex-media-server-on-ubuntu-20-04/)
- [SMB/CIFS on ubuntu](https://linuxhint.com/mount-smb-shares-on-ubuntu/)
- [Audnexus](https://github.com/djdembeck/Audnexus.bundle)
- [mutagen-inspect](https://mutagen.readthedocs.io/en/latest/man/mutagen-inspect.html)
- [npm/node metadata tagging](https://www.npmjs.com/package/music-metadata)
- [auto-m4b](https://registry.hub.docker.com/r/seanap/auto-m4b/)
- [beets tagging](https://github.com/Neurrone/beets-audible)
  - [seanap's fork](https://github.com/seanap/beets-audible)
- [xirg's mp3tag](https://github.com/Xirg/docker-mp3tag)
- [BragiBooks](https://github.com/djdembeck/bragibooks)
- [audio tagging in Go](https://github.com/dhowden/tag)
- [m4b-tool](https://github.com/sandreas/m4b-tool)
- [@kentcdodds/podcastify-dir](https://github.com/kentcdodds/podcastify-dir)
