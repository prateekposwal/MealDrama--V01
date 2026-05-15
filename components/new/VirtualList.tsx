import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  outerClassName?: string;
  as?: 'div' | 'ol' | 'ul';
}

function VirtualListInner<T>({
  items,
  estimateSize,
  overscan = 3,
  renderItem,
  className = '',
  outerClassName = '',
  as = 'div',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const Tag = as;

  if (items.length <= 10) {
    return (
      <Tag className={className}>
        {items.map((item, i) => renderItem(item, i))}
      </Tag>
    );
  }

  return (
    <div ref={parentRef} className={`${outerClassName} overflow-auto`}>
      <Tag className={className} style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index]!, virtualRow.index)}
          </div>
        ))}
      </Tag>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
