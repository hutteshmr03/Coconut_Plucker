import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="ic">
        <Icon size={38} strokeWidth={1.5} />
      </div>
      <h4>{title}</h4>
      <p style={{ maxWidth: '400px', margin: '0 auto 16px', fontSize: '13px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
