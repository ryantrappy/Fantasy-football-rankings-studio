import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function PageHeading({
  title,
  description,
  eyebrow,
  controls,
  children,
  className,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  controls?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`studio-heading page-command-bar${className ? ` ${className}` : ''}`}>
      <div className="studio-heading-copy">
        {eyebrow && (
          <span className="studio-eyebrow">
            <Icon name="ball" size={16} />
            {eyebrow}
          </span>
        )}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {controls && <div className="page-command-controls">{controls}</div>}
      {children && <div className="studio-heading-actions">{children}</div>}
    </section>
  );
}
