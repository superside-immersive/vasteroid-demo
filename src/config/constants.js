/**
 * Game Constants and Configuration
 * Contains all global constants, key codes, and theme settings
 */

// Key code mappings
var KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  70: 'f',
  71: 'g',
  72: 'h',
  77: 'm',
  80: 'p'
};

// Key status tracker
var KEY_STATUS = { keyDown: false };
for (var code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

// Grid size for spatial partitioning
var GRID_SIZE = 60;

// Visual theme (VAST-inspired)
var THEME = {
  bg: '#0E142C',
  text: '#E5E7EB',
  primary: '#1FD9FE',
  secondary: '#06D69F',
  danger: '#D91247',
  warning: '#FFBC42',
  muted: '#9CA3AF'
};

// Character pool for asteroid letters/numbers
var ASTEROID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?!';

// Default asteroid character count (modifiable via UI slider)
var ASTEROID_CHAR_COUNT = 200;

// Global flag for showing hitboxes (debug)
var SHOW_HITBOXES = false;

/**
 * Get stroke color based on sprite name
 * @param {string} name - Sprite name
 * @returns {string} - Hex color
 */
function strokeForSpriteName(name) {
  switch (name) {
    case 'ship':
      return THEME.primary;
    case 'bullet':
      return THEME.secondary;
    case 'alienbullet':
    case 'bigalien':
      return THEME.danger;
    case 'asteroid':
      return THEME.muted;
    case 'explosion':
      return THEME.warning;
    default:
      return THEME.primary;
  }
}
