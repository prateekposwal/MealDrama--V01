import React from 'react';
import { ShoppingCart, Plus, AlertCircle } from 'lucide-react';

const Pantry: React.FC = () => {
    const items = [
        { name: 'Milk', qty: '1L', expiry: 'Tomorrow', status: 'critical' },
        { name: 'Eggs', qty: '6 pcs', expiry: 'in 4 days', status: 'good' },
        { name: 'Paneer', qty: '200g', expiry: 'in 2 days', status: 'warning' },
        { name: 'Wheat Flour', qty: '5kg', expiry: 'in 3 months', status: 'good' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">PantryPulse</h2>
                    <p className="text-[#717171] font-medium">Tracking 14 ingredients</p>
                </div>
                <button className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[#FF385C]">
                    <Plus size={24} />
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="apple-card flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${item.status === 'critical' ? 'bg-red-50 text-red-500' :
                                    item.status === 'warning' ? 'bg-orange-50 text-orange-500' :
                                        'bg-green-50 text-green-500'
                                }`}>
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{item.name}</h4>
                                <p className="text-xs text-[#717171] font-medium">{item.qty}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${item.status === 'critical' ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                {item.status === 'critical' && <AlertCircle size={10} />}
                                {item.expiry}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Smart Shopping List</h3>
                    <p className="text-gray-400 text-sm mb-6">We've identified 3 items you'll need for next week's plan.</p>
                    <button className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm">Review List</button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </section>
        </div>
    );
};

export default Pantry;
