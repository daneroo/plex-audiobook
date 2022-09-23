const path = require('path')
const { startServer } = require('@kentcdodds/podcastify-dir')

startServer({
  title: "Daneroo's Audiobooks",
  description: "Daneroo's Audiobooks",
  image: {
    // url: 'https://www.dropbox.com/s/some-id/some-filename.jpg?raw=1',
    // url: 'https://ipfs.io/ipfs/bafy..',
    url:
      'https://cloudflare-ipfs.com/ipfs/bafybeid2fflou6qr5muhowwlnkhk4toigat65cuhzh7qda2wruwdsxd62a/GoodReads-Challenge-2021.png',
    title: "Daneroo's Audiobooks",
    link: 'https://daniel-lauzon.com/',
    height: 796,
    width: 398
  },
  port: 8879,
  directory: '/Users/daniel/Library/OpenAudible/mp3',
  users: { daniel: 'sekret' },
  modifyXmlJs (xmlJs) {
    xmlJs.rss.channel['itunes:author'] = 'Daniel Lauzon'
    xmlJs.rss.channel['itunes:summary'] = "Daneroo's Audiobooks"
    return xmlJs
  }
})
