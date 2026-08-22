import React, { useState } from 'react';
import { getDishImageUrl } from '../../utils/dishImages';

interface DishImageProps {
    name?: string;
    slot?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    customImageUrl?: string;
}

const SIZE_CLASSES: Record<string, string> = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    full: 'w-full',
};

const DishImage: React.FC<DishImageProps> = ({ name, slot, size = 'lg', className = '', customImageUrl }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imageUrl = customImageUrl || getDishImageUrl(name, slot);

    if (!imageUrl || error) {
        return (
            <div className={`${SIZE_CLASSES[size]} bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${className}`}>
                🍽️
            </div>
        );
    }

    return (
        <div className={`${SIZE_CLASSES[size]} bg-white rounded-2xl overflow-hidden shadow-sm relative ${className}`}>
            {!loaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-2xl" />
            )}
            <img
                src={imageUrl}
                alt={name || 'dish'}
                className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                loading="lazy"
            />
        </div>
    );
};

export default DishImage;
