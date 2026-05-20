import React, { useState, useRef, useEffect } from 'react';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`
);

export const TimeBadge: React.FC<{
    start: string;
    end: string;
    onEdit: () => void;
}> = ({ start, end, onEdit }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-bold tracking-tight hover:bg-gray-200 active:scale-95 transition-all min-w-[110px] justify-center"
        title="Edit time window"
    >
        🕒 {start} – {end}
    </button>
);

export const TimeEditor: React.FC<{
    start: string;
    end: string;
    onSave: (start: string, end: string) => void;
    onCancel: () => void;
}> = ({ start, end, onSave, onCancel }) => {
    const [s, setS] = useState(start);
    const [e, setE] = useState(end);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (ev: MouseEvent) => {
            if (ref.current && !ref.current.contains(ev.target as Node)) onCancel();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onCancel]);

    return (
        <div
            ref={ref}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-gray-100 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
        >
            <select
                value={s}
                onChange={e => setS(e.target.value)}
                className="text-[9px] font-bold text-gray-700 bg-transparent border-none outline-none appearance-none cursor-pointer w-12 text-center"
            >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-[9px] text-gray-400">–</span>
            <select
                value={e}
                onChange={e => setE(e.target.value)}
                className="text-[9px] font-bold text-gray-700 bg-transparent border-none outline-none appearance-none cursor-pointer w-12 text-center"
            >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <button
                onClick={() => onSave(s, e)}
                className="ml-1 px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold active:scale-95 transition-all"
            >
                Save
            </button>
        </div>
    );
};
