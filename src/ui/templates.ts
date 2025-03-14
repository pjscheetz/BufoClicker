/**
 * Common HTML templates used in the UI
 * This centralizes common markup patterns to maintain consistency
 */

import { COMPONENT, STATE } from './styles';

/**
 * Generate HTML for a section header
 * @param title Section title
 * @param id Optional ID for the header
 * @returns HTML string
 */
export function sectionHeader(title: string, id?: string): string {
  const idAttr = id ? ` id="${id}"` : '';
  return `<h2 class="section-header"${idAttr}>${title}</h2>`;
}

/**
 * Generate HTML for a panel
 * @param title Panel title
 * @param content Panel content HTML
 * @param id Optional ID for the panel
 * @param className Optional additional classes
 * @returns HTML string
 */
export function panel(title: string, content: string, id?: string, className?: string): string {
  const idAttr = id ? ` id="${id}"` : '';
  const classAttr = className ? ` ${className}` : '';
  
  return `
    <div class="game-panel${classAttr}"${idAttr}>
      <div class="panel-header">
        <h2>${title}</h2>
      </div>
      <div class="panel-content">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Generate HTML for a button
 * @param text Button text
 * @param id Optional ID for the button
 * @param onClick Optional onclick attribute content
 * @param className Optional additional classes
 * @param disabled Whether the button is disabled
 * @returns HTML string
 */
export function button(
  text: string,
  id?: string,
  onClick?: string,
  className?: string,
  disabled?: boolean
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const onClickAttr = onClick ? ` onclick="${onClick}"` : '';
  const classAttr = className ? ` ${className}` : '';
  const disabledAttr = disabled ? ' disabled' : '';
  const disabledClass = disabled ? ` ${STATE.disabled}` : '';
  
  return `
    <button class="game-button${classAttr}${disabledClass}"${idAttr}${onClickAttr}${disabledAttr}>
      ${text}
    </button>
  `;
}

/**
 * Generate HTML for an icon button
 * @param icon Icon HTML or text
 * @param id Optional ID for the button
 * @param tooltip Optional tooltip text
 * @param onClick Optional onclick attribute content
 * @param className Optional additional classes
 * @param disabled Whether the button is disabled
 * @returns HTML string
 */
export function iconButton(
  icon: string,
  id?: string,
  tooltip?: string,
  onClick?: string,
  className?: string,
  disabled?: boolean
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const onClickAttr = onClick ? ` onclick="${onClick}"` : '';
  const classAttr = className ? ` ${className}` : '';
  const titleAttr = tooltip ? ` title="${tooltip}"` : '';
  const disabledAttr = disabled ? ' disabled' : '';
  const disabledClass = disabled ? ` ${STATE.disabled}` : '';
  
  return `
    <button class="icon-button${classAttr}${disabledClass}"${idAttr}${onClickAttr}${titleAttr}${disabledAttr}>
      ${icon}
    </button>
  `;
}

/**
 * Generate HTML for a progress bar
 * @param value Current value
 * @param max Maximum value
 * @param id Optional ID for the progress bar
 * @param showLabel Whether to show a percentage label
 * @param className Optional additional classes
 * @returns HTML string
 */
export function progressBar(
  value: number,
  max: number,
  id?: string,
  showLabel: boolean = true,
  className?: string
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const classAttr = className ? ` ${className}` : '';
  const percentage = Math.floor((value / max) * 100);
  
  return `
    <div class="progress-container${classAttr}"${idAttr}>
      <div class="progress-bar" style="width: ${percentage}%"></div>
      ${showLabel ? `<span class="progress-label">${percentage}%</span>` : ''}
    </div>
  `;
}

/**
 * Generate HTML for a resource display
 * @param amount Resource amount
 * @param name Resource name
 * @param id Optional ID for the resource display
 * @param showRate Whether to show the production rate
 * @param rate Production rate
 * @param className Optional additional classes
 * @returns HTML string
 */
export function resourceDisplay(
  amount: number | string,
  name: string,
  id?: string,
  showRate: boolean = false,
  rate?: number | string,
  className?: string
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const classAttr = className ? ` ${className}` : '';
  
  return `
    <div class="${COMPONENT.resourceDisplay}${classAttr}"${idAttr}>
      <div class="resource-count">${amount}</div>
      ${showRate && rate !== undefined ? `<div class="production-rate">${rate}/sec</div>` : ''}
    </div>
  `;
}

/**
 * Generate HTML for a tooltip
 * @param content Tooltip content
 * @param title Optional tooltip title
 * @param id Optional ID for the tooltip
 * @param className Optional additional classes
 * @returns HTML string
 */
export function tooltip(
  content: string,
  title?: string,
  id?: string,
  className?: string
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const classAttr = className ? ` ${className}` : '';
  const titleHtml = title ? `<div class="tooltip-header">${title}</div>` : '';
  
  return `
    <div class="game-tooltip${classAttr}"${idAttr}>
      ${titleHtml}
      <div class="tooltip-content">${content}</div>
    </div>
  `;
}

/**
 * Generate HTML for a notification
 * @param message Notification message
 * @param type Notification type (info, success, warning, error)
 * @param id Optional ID for the notification
 * @returns HTML string
 */
export function notification(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  id?: string
): string {
  const idAttr = id ? ` id="${id}"` : '';
  
  return `
    <div class="notification notification-${type}"${idAttr}>
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    </div>
  `;
}

/**
 * Generate HTML for a modal dialog
 * @param title Modal title
 * @param content Modal content
 * @param buttons Array of button configurations
 * @param id Optional ID for the modal
 * @param closeOnBackdrop Whether to close on backdrop click
 * @returns HTML string
 */
export function modal(
  title: string,
  content: string,
  buttons: Array<{text: string, callback: string, className?: string}> = [],
  id?: string,
  closeOnBackdrop: boolean = true
): string {
  const idAttr = id ? ` id="${id}"` : '';
  const backdropAttr = closeOnBackdrop ? ' data-close-on-backdrop="true"' : '';
  
  const buttonsHtml = buttons.length > 0 
    ? `
      <div class="modal-footer">
        ${buttons.map(btn => {
          const className = btn.className || 'modal-button';
          return `<button class="${className}" onclick="${btn.callback}">${btn.text}</button>`;
        }).join('')}
      </div>
    ` 
    : '';
  
  return `
    <div class="modal"${idAttr}${backdropAttr}>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${buttonsHtml}
      </div>
    </div>
  `;
}

/**
 * Generate HTML for a tab container
 * @param tabs Array of tab configurations
 * @param defaultTab ID of the default active tab
 * @param id Optional ID for the tab container
 * @returns HTML string
 */
export function tabContainer(
  tabs: Array<{id: string, label: string, content: string, icon?: string}>,
  defaultTab: string,
  id?: string
): string {
  const idAttr = id ? ` id="${id}"` : '';
  
  const tabButtons = tabs.map(tab => {
    const isActive = tab.id === defaultTab;
    const activeClass = isActive ? ' active' : '';
    const iconHtml = tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : '';
    
    return `
      <button class="tab-button${activeClass}" data-tab="${tab.id}">
        ${iconHtml}
        <span class="tab-label">${tab.label}</span>
      </button>
    `;
  }).join('');
  
  const tabContents = tabs.map(tab => {
    const isActive = tab.id === defaultTab;
    const display = isActive ? 'block' : 'none';
    
    return `
      <div id="tab-${tab.id}" class="tab-content" style="display: ${display}">
        ${tab.content}
      </div>
    `;
  }).join('');
  
  return `
    <div class="tab-container"${idAttr}>
      <div class="tab-buttons">
        ${tabButtons}
      </div>
      <div class="tab-contents">
        ${tabContents}
      </div>
    </div>
  `;
}