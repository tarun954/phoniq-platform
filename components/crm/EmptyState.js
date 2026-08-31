export default function EmptyState({ title, text }) {
    return (
      <div className="module-empty">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    );
  }
  