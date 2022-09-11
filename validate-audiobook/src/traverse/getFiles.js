import Walk from '@root/walk'

// return all files from rootPath
// if recurse is false, only get files in rootPath, not subdirectories
export async function getFiles (rootPath, options = { recurse: false }) {
  const pathnames = []
  await Walk.walk(rootPath, async (err, pathname, dirent) => {
    if (err) {
      // throw an error to stop walking (or return to ignore and keep going)
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return
    }
    if (dirent.isDirectory()) {
      // We recurse into subdirectories when
      // - recurse parameter is true
      // - we are at the root
      return options?.recurse || rootPath === pathname
    } else if (dirent.isFile()) {
      pathnames.push(pathname)
    } else {
      // dirent.isSymbolicLink(), etc...
      // console.error('  skipping', dirent.name)
    }
  })
  return pathnames
}
