import Walk from '@root/walk'

// get all directories as paths, recursively, including rootPath itself
export async function getDirectories (rootPath) {
  const directories = []
  await Walk.walk(rootPath, async (err, pathname, dirent) => {
    if (err) {
      // throw an error to stop walking (or return to ignore and keep going)
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return
    }
    if (dirent.isDirectory()) {
      directories.push(pathname)
    }
  })
  return directories
}
