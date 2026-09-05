"use client";

export default function ResponsivePageHeader({
  title,
  description,
  actions,
  children,
}) {
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}

        {children}
      </div>

      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
