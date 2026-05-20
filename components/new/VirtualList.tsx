import React, { useRef, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  outerClassName?: string;
  as?: 'div' | 'ol' | 'ul';
  getKey?: (item: T, index: number) => string | number;
}

function VirtualListInner<T>({
  items,
  estimateSize,
  overscan = 3,
  renderItem,
  className = '',
  outerClassName = '',
  as = 'div',
  getKey,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Stable key function — reads from ref to avoid stale closure
  const getItemKey = useMemo(() => {
    return (index: number) => getKey ? getKey(itemsRef.current[index]!, index) : index;
  }, [getKey]);

  const virtualizerOptions = useMemo(() => ({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey,
  }), [items.length, estimateSize, overscan, getItemKey]);

  const virtualizer = useVirtualizer(virtualizerOptions);

  const Tag = as;

  return (
    <div ref={parentRef} className={`${outerClassName} overflow-auto`}>
      {items.length <= 10 ? (
        <Tag className={className}>
          {items.map((item, i) => <React.Fragment key={getKey ? getKey(item, i) : i}>{renderItem(item, i)}</React.Fragment>)}
        </Tag>
      ) : (
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
      )}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
