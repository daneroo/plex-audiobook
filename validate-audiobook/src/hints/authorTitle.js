import { db } from './db.js'
export function getAuthor (directoryPath) {
  // console.error('Looking up author for ', directoryPath)
  return db?.[directoryPath]?.author
}
export function getTitle (directoryPath) {
  return db?.[directoryPath]?.title
}
