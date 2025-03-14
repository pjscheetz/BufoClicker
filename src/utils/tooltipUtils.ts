/**
 * Shared tooltip utils to ensure consistent tooltip behavior
 * This helps avoid duplicate tooltip elements and simplifies tooltip management
 */

// Track the tooltip timeout to allow for cancellation
let tooltipTimeout: number | null = null;
// Track the last mouse position to detect movement
let lastMouseX = 0;
let lastMouseY = 0;
// Track if a tooltip is currently active
let isTooltipActive = false;
// Delay before showing tooltip (in milliseconds)
const TOOLTIP_DELAY = 300;
// Distance in pixels that counts as "movement" to hide the tooltip
const MOVEMENT_THRESHOLD = 5;

/**
 * Show tooltip with provided content after a delay
 * @param content HTML content for the tooltip
 * @param e Mouse event that triggered the tooltip
 * @returns void
 */
export function showTooltip(content: string, e: MouseEvent): void {
  // Store initial mouse position
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  
  // Clear any existing timeout to prevent duplicate tooltips
  if (tooltipTimeout !== null) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
  // Set a timeout to show the tooltip after delay
  tooltipTimeout = window.setTimeout(() => {
    // Remove any existing tooltips first to prevent duplicates
    hideTooltip();
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'game-tooltip';
    tooltip.classList.add('game-tooltip');
    
    // Set content
    tooltip.innerHTML = content;
    
    // Position tooltip initially at mouse position
    tooltip.style.left = `${e.clientX + 15}px`;
    tooltip.style.top = `${e.clientY + 15}px`;
    
    // Add to document
    document.body.appendChild(tooltip);
    
    // Make visible after positioning
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
    
    // Ensure tooltip stays within viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (tooltipRect.right > viewportWidth) {
      tooltip.style.left = `${e.clientX - tooltipRect.width - 15}px`;
    }
    
    if (tooltipRect.bottom > viewportHeight) {
      tooltip.style.top = `${e.clientY - tooltipRect.height - 15}px`;
    }
    
    // Mark tooltip as active
    isTooltipActive = true;
    
    // Add a global mousemove listener to hide tooltip on movement
    document.addEventListener('mousemove', handleMouseMovement);
    
    tooltipTimeout = null;
  }, TOOLTIP_DELAY);
}

/**
 * Handle mouse movement to determine if tooltip should be hidden
 * @param e Mouse event
 */
function handleMouseMovement(e: MouseEvent): void {
  if (!isTooltipActive) return;
  
  // Calculate distance moved
  const deltaX = Math.abs(e.clientX - lastMouseX);
  const deltaY = Math.abs(e.clientY - lastMouseY);
  
  // If mouse moved more than threshold, hide tooltip
  if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
    hideTooltip();
  }
}

/**
 * Cancel pending tooltip if mouse leaves before timeout completes
 */
export function cancelTooltip(): void {
  if (tooltipTimeout !== null) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
}

/**
 * Hide and remove tooltip
 */
export function hideTooltip(): void {
  // Remove global mousemove listener
  document.removeEventListener('mousemove', handleMouseMovement);
  
  // Reset active state
  isTooltipActive = false;
  
  // Clear any pending tooltip timeout
  if (tooltipTimeout !== null) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
  const tooltip = document.getElementById('game-tooltip');
  if (!tooltip) return;
  
  tooltip.classList.remove('visible');
  
  // Remove after transition
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }, 300);
}

/**
 * Update tooltip position is no longer needed since we hide on movement
 * But keeping a simplified version for compatibility
 */
export function updateTooltipPosition(e: MouseEvent): void {
  // With the new implementation, we hide the tooltip on movement
  // So this function is mostly deprecated
  
  // You could optionally re-implement this if you want tooltips 
  // to follow the cursor until a threshold is reached
  
  // For now, we'll just track the position but not update the tooltip
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}