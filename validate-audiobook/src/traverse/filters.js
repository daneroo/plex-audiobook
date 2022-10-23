import path from 'path'

// Filter for known audio filename extensions
export function filterAudioFileExtensions(filePath) {
  const includedExtensions = ['.mp3', '.m4b', '.m4a']
  return includedExtensions.includes(path.extname(filePath))
}

// Filter for known NOT audio filenames and filename extensions
export function filterNonAudioExtensionsOrNames(filePath) {
  return (
    filterNonAudioFileExtensions(filePath) || filterNonAudioFilenames(filePath)
  )
}

// Filter for known NOT audio filename extensions
export function filterNonAudioFileExtensions(filePath) {
  const excludedExtensions = [
    '.jpeg',
    '.jpg',
    '.JPG',
    '.gif',
    '.png',
    '.pdf',
    '.cue',
    '.epub',
    '.txt',
    '.nfo',
    '.mobi',
    '.m3u',
    '.rtf',
  ]
  const ext = path.extname(filePath)
  return excludedExtensions.includes(ext)
}

// Filter for known NOT audio filenames
export function filterNonAudioFilenames(filePath) {
  const excludedFilenames = ['.DS_Store', 'MD5SUM']
  return excludedFilenames.includes(path.basename(filePath))
}
