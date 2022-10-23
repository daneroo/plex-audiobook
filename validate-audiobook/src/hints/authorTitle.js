import { db } from './db.js'
export function getAuthor(directoryPath) {
  // console.error('Looking up author for ', directoryPath)
  return db?.[directoryPath]?.author?.[0]
}
export function getTitle(directoryPath) {
  return db?.[directoryPath]?.title?.[0]
}
export function getSkip(directoryPath) {
  return db?.[directoryPath]?.skip
}
