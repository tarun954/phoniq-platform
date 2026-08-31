export default function Template({ children }) {
    // IMPORTANT:
    // Do not mount the CRM sidebar/topbar here.
    // Client route layouts and CRMPageShell are responsible for the client chrome.
    // Keeping template.js transparent prevents duplicate shells and stale scroll positions.
    return children;
  }
  