/* eslint-disable regexp/prefer-w */
/* eslint-disable unicorn/prefer-string-starts-ends-with */

import { USERNAME_MAX_SIZE, USERNAME_MIN_SIZE } from './constants'

export type ValidationResult
  = | { ok: true }
    | { ok: false, message: string }

export function validateUserId(id: number): ValidationResult {
  if (!Number.isSafeInteger(id)) {
    return { ok: false, message: 'user ID is not a safe integer' }
  }
  if (id <= 0) {
    return { ok: false, message: 'user ID must be positive' }
  }
  return { ok: true }
}

/**
 * Validates that a given string is a valid Telegram username.
 */
export function validateUsername(username: string): ValidationResult {
  if (!/^[a-z0-9_]+$/i.test(username)) {
    return { ok: false, message: 'username can only contain a-z, 0-9 and underscores' }
  }

  if (/^\d/.test(username)) {
    return { ok: false, message: 'username cannot start with a number' }
  }

  if (/^_/.test(username)) {
    return { ok: false, message: 'username cannot start with an underscore' }
  }

  if (/_$/.test(username)) {
    return { ok: false, message: 'username cannot end with an underscore' }
  }

  if (username.includes('__')) {
    return { ok: false, message: 'username cannot contain consecutive underscores' }
  }

  if (username.length < USERNAME_MIN_SIZE) {
    return { ok: false, message: `username is too short (min ${USERNAME_MIN_SIZE} characters)` }
  }

  if (username.length > USERNAME_MAX_SIZE) {
    return { ok: false, message: `username is too long (max ${USERNAME_MAX_SIZE} characters)` }
  }

  return { ok: true }
}

/**
 * Validates that a given string is a valid Telegram username for bot.
 */
export function validateBotUsername(username: string): ValidationResult {
  const result = validateUsername(username)
  if (!result.ok) {
    return result
  }
  if (!username.toLowerCase().endsWith('bot')) {
    return { ok: false, message: 'bot username must end with "bot"' }
  }
  return { ok: true }
}

export function checkOk(result: ValidationResult): void {
  if (!result.ok) {
    throw new Error(`Validation failed: ${result.message}`)
  }
}
