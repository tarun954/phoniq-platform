export default function ModuleHeader({
    eyebrow = "Operations",
    title,
    subtitle,
    action,
  }) {
    return (
      <div className="module-header">
        <div>
          <div className="module-eyebrow">{eyebrow}</div>
          <h1 className="module-title">{title}</h1>
          {subtitle && <p className="module-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="module-action">{action}</div>}
      </div>
    );
  }
  