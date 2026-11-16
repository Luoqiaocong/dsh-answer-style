/**
 * Host half of dsh-answer-style.
 *
 * The whole feature lives in the browser bundle (`./client`): it registers a
 * settings section and injects a scoped stylesheet. This half only has to
 * exist so the loader row composes on the Host; it contributes no services,
 * no routes and no model content.
 */

/** Cordis plugin name. */
export const name = 'answer-style'

/** No Host services are required. */
export const inject = []

/** No-op Host apply. */
export function apply() {}
