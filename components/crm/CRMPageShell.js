"use client";

import ClientRouteShell from "@/components/crm/ClientRouteShell";
import { useInsideClientChrome } from "@/components/crm/ClientChromeContext";

export default function CRMPageShell({
  children,
  eyebrow,
  title,
  description,
  actions,
}) {
  const insideClientChrome = useInsideClientChrome();

  const content = (
    <>
      {(eyebrow || title || description || actions) && (
        <div className="crm-page-heading">
          <div className="crm-page-heading-copy">
            {eyebrow && <p className="crm-page-eyebrow">{eyebrow}</p>}

            {title && <h1 className="crm-page-title">{title}</h1>}

            {description && (
              <p className="crm-page-description">{description}</p>
            )}
          </div>

          {actions && <div className="crm-page-actions">{actions}</div>}
        </div>
      )}

      {children}

      <style jsx global>{`
        .crm-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin: 0 0 24px !important;
          padding: 0 !important;
          min-height: 0 !important;
          min-width: 0;
        }

        .crm-page-heading-copy {
          min-width: 0;
          flex: 1 1 auto;
        }

        .crm-page-eyebrow {
          margin: 0 0 7px;
          color: #2563eb;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .crm-page-title {
          margin: 0;
          color: #0f172a;
          font-size: 38px;
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -0.7px;
          overflow-wrap: anywhere;
        }

        .crm-page-description {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.55;
          max-width: 760px;
        }

        .crm-page-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 0 0 auto;
        }

        @media (max-width: 800px) {
          .crm-page-heading {
            flex-direction: column;
            gap: 14px;
          }

          .crm-page-title {
            font-size: 32px;
          }

          .crm-page-actions {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .crm-page-title {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );

  if (insideClientChrome) {
    return content;
  }

  return <ClientRouteShell>{content}</ClientRouteShell>;
}
