// src/modules/issues/constants.js
// Shared constants for issue components

/**
 * All possible issue status values
 */
export const ALL_STATUSES = ['Todo', 'Open', 'New', 'In Progress', 'Fixed', 'Closed', 'Resolved'];

/**
 * Status values that indicate an issue has been resolved
 * Used for filtering, styling, and animation logic
 */
export const RESOLVED_STATUSES = ['Fixed', 'Closed', 'Resolved'];

/**
 * Status values that indicate an issue is active (not resolved)
 */
export const ACTIVE_STATUSES = ['Todo', 'Open', 'New', 'In Progress'];

/**
 * Maximum number of characters to display in description preview
 * before truncating with ellipsis
 */
export const MAX_DESCRIPTION_LENGTH = 180;

/**
 * Duration of vanishing animation when issue is marked as resolved
 * Should match CSS animation duration in milliseconds
 */
export const VANISH_ANIMATION_DURATION = 800;

/**
 * Default severity level when not specified
 */
export const DEFAULT_SEVERITY = 'Medium';

/**
 * Default author name when creator is unknown
 */
export const DEFAULT_AUTHOR = 'System';

/**
 * Default module name when not specified
 */
export const DEFAULT_MODULE = 'Unknown Module';
