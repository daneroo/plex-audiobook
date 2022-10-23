// @ts-check

/**
 * Formats the time since the startMs to a string
 * @param {number} startMs - reference start time in milliseconds
 * @returns {string} Return the formatted string
 */

export function formatElapsed(startMs) {
  const elapsedSeconds = ((+new Date() - startMs) / 1000).toFixed(3)
  return elapsedSeconds + 's'
}

/**
 * TODO Consider other options
 * - use String.padStart
 * - consider use in chapters.yml
 * - constant width seconds and minutes (if no leading 0)
 * - consider using ':' as separator
 * - we don't want days, max unit is hours, even above 24h
 *
 * @param {number} [seconds=0] - assumed to be integer>0
 * @returns {string} - formatted string e.e. 3m4s or 1h2m3s
 */
export function durationToHMS(seconds = 0) {
  // assume seconds is an integer > 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}h${m}m${s}s`
  }
  if (m > 0) {
    return `${m}m${s}s`
  }
  return `${s}s`
}
