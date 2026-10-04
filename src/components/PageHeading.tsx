import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function PageHeading({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description: string;
  eyebrow: string;
  children?: ReactNode;
}) {
  return (
    <div className="studio-heading">
      <div className="studio-heading-copy">
        <span className="studio-eyebrow">
          <Icon name="ball" size={16} />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="studio-heading-actions">{children}</div>}
    </div>
  );
}
