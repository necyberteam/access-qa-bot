/**
 * shadow-dom-styles.ts
 *
 * Injects qa-bot-core CSS overrides into a shadow root.
 *
 * qa-bot-core's rollup build injects its CSS into document.head via postcss.
 * In a shadow DOM (e.g. access-ci-ui), those styles don't cross the shadow
 * boundary, so react-chatbotify's defaults (like width: 80% on checkbox rows)
 * win. This utility re-injects the critical layout overrides directly into the
 * shadow root so they take effect.
 */

const SHADOW_STYLE_ID = 'access-qa-bot-shadow-overrides';

const SHADOW_CSS = `
.rcb-checkbox-container {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin-left: 16px !important;
  padding-top: 12px !important;
  max-width: 100% !important;
}

.rcb-checkbox-row-container {
  display: flex !important;
  align-items: center !important;
  background-color: #ffffff !important;
  border: 1px solid #d0d0d0 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  padding: 8px 12px !important;
  margin: 0 !important;
  min-height: auto !important;
  max-height: auto !important;
  width: auto !important;
  flex: 0 0 auto !important;
  transition: all 0.2s ease !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: var(--primaryColor, #107180) !important;
  text-align: center !important;
  box-sizing: border-box !important;
}

.rcb-checkbox-row-container:hover {
  background-color: #e8f4f8 !important;
  border-color: var(--primaryColor, #107180) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 4px rgba(16, 113, 128, 0.2) !important;
}

.rcb-checkbox-row-container[data-checked="true"] {
  background-color: var(--primaryColor, #107180) !important;
  border-color: var(--primaryColor, #107180) !important;
  color: white !important;
}

.rcb-checkbox-row {
  margin-left: 0px !important;
}

.rcb-checkbox-mark {
  width: 14px !important;
  height: 14px !important;
  margin-right: 6px !important;
}

.rcb-checkbox-label {
  font-size: 13px !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

.rcb-checkbox-next-button {
  background-color: #ffffff !important;
  border: 1px solid #d0d0d0 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  padding: 8px 12px !important;
  margin: 0 !important;
  min-height: auto !important;
  max-height: auto !important;
  width: auto !important;
  flex: 0 0 auto !important;
  transition: all 0.2s ease !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: var(--secondaryColor, #107180) !important;
  text-align: center !important;
  box-sizing: border-box !important;
}

.rcb-checkbox-next-button:hover {
  background-color: #e8f4f8 !important;
  border-color: var(--secondaryColor, #107180) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 4px rgba(16, 113, 128, 0.2) !important;
}

.rcb-options-container {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin: 16px 16px !important;
  padding: 0 !important;
}

.rcb-options {
  border: 1px solid #d0d0d0 !important;
  outline: none !important;
  background-color: #ffffff !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  text-align: center !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: var(--secondaryColor, #107180) !important;
  width: auto !important;
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
}

.rcb-options:hover {
  background-color: #e8f4f8 !important;
  border-color: var(--secondaryColor, #107180) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 4px rgba(16, 113, 128, 0.2) !important;
}

.rcb-options:active {
  background-color: var(--secondaryColor, #107180) !important;
  border-color: var(--secondaryColor, #107180) !important;
  color: white !important;
  transform: translateY(0) !important;
}
`;

/**
 * If the given element is inside a shadow DOM, inject CSS overrides
 * into the shadow root. No-op when running outside shadow DOM.
 */
export function injectShadowDomStyles(element: HTMLElement | null): void {
  if (!element) return;

  const root = element.getRootNode();
  if (!(root instanceof ShadowRoot)) return;

  // Don't inject twice
  if (root.getElementById(SHADOW_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SHADOW_STYLE_ID;
  style.textContent = SHADOW_CSS;
  root.appendChild(style);
}
