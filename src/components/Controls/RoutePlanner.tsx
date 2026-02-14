import React from 'react';
import { Settings, Map as MapIcon, RotateCw, Navigation, ChevronDown, Trees, Building2, Zap, VolumeX, Octagon, Activity, CornerUpRight, MapPin } from 'lucide-react';
import type { RouteRequest } from '../../types';

interface RoutePlannerProps {
    requests: Omit<RouteRequest, 'start'>;
    onChange: (req: Omit<RouteRequest, 'start'>) => void;
    onGenerate: () => void;
    isLoading: boolean;
    hasDestination: boolean;
    onToggleDestination: (enabled: boolean) => void;
    hasRoute?: boolean;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ requests, onChange, onGenerate, isLoading, hasDestination, onToggleDestination, hasRoute, isOpen, onOpenChange }) => {


    const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseFloat(e.target.value);
        if (val >= 42) val = 42.195;
        onChange({ ...requests, distance: val });
    };

    const togglePreference = (key: keyof typeof requests.preferences) => {
        onChange({
            ...requests,
            preferences: {
                ...requests.preferences,
                [key]: !requests.preferences[key]
            }
        });
    };

    const preferencesList = [
        { key: 'scenery', label: '景観 (自然)', icon: <Trees className="w-4 h-4" />, color: 'blue' },
        { key: 'urban', label: '景観 (都会)', icon: <Building2 className="w-4 h-4" />, color: 'blue' },
        { key: 'safety', label: '安全 (街灯)', icon: <Zap className="w-4 h-4" />, color: 'blue' },
        { key: 'quiet', label: '静か (交通量少)', icon: <VolumeX className="w-4 h-4" />, color: 'blue' },
        { key: 'fewLights', label: '信号少なめ', icon: <Octagon className="w-4 h-4" />, color: 'blue' },
        { key: 'flat', label: '平坦', icon: <Activity className="w-4 h-4" />, color: 'blue' },
        { key: 'minimizeTurns', label: '曲がり角少なめ', icon: <CornerUpRight className="w-4 h-4" />, color: 'blue' },
    ];

    return (
        <>
            {/* Mobile Toggle Button - Hidden if Route exists (handled by RouteDetails) UNLESS open (Close button) */}
            {(isOpen || !hasRoute) && (
                <button
                    onClick={() => onOpenChange(!isOpen)}
                    className={`
                        md:hidden fixed right-6 z-[1000] w-14 h-14 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white active:scale-90 transition-all duration-300
                        bottom-6
                    `}
                >
                    {isOpen ? <ChevronDown /> : <Settings />}
                </button>
            )}

            {/* Main Panel */}
            <div className={`
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl
                
                /* Desktop Sizing */
                md:w-full md:rounded-3xl md:p-6 md:relative md:transform-none md:opacity-100
                
                /* Mobile Sizing (Bottom Sheet) */
                fixed bottom-0 left-0 w-full z-[900] rounded-t-3xl p-6
                ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 md:translate-y-0 md:opacity-100'}
            `}>
                {/* Mobile Drag Handle */}
                <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" onClick={() => onOpenChange(false)} />

                <div className="flex items-center gap-3 mb-6 border-b border-gray-200/50 pb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <MapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        RunRoute <span className="text-sm font-medium text-gray-500">(ランルー)</span>
                    </h1>
                </div>

                <div className="space-y-5 max-h-[70vh] md:max-h-none overflow-y-auto scrollbar-hide pb-20 md:pb-0 relative">


                    {/* Distance Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-blue-500" />
                                目標距離
                            </label>
                            <span className="text-3xl font-black text-blue-600 tracking-tight">
                                {requests.distance.toFixed(1)}
                                <span className="text-sm text-gray-400 font-medium ml-1">km</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="42"
                            step="0.5"
                            value={requests.distance}
                            onChange={handleDistanceChange}
                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 active:accent-blue-800 transition-all touch-none"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
                            <span>1.0 km</span>
                            <span>42.195 km</span>
                        </div>
                    </div>

                    {/* Route Type */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <RotateCw className="w-4 h-4 text-blue-500" />
                            ルートタイプ
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                onClick={() => onChange({ ...requests, type: 'loop' })}
                                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 whitespace-nowrap ${requests.type === 'loop'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                スタート地点に戻る
                            </button>
                            <button
                                onClick={() => { onChange({ ...requests, type: 'one-way' }); onOpenChange(true); }}
                                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${requests.type === 'one-way'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                片道 / 目的地へ
                            </button>
                        </div>


                        {/* Destination Toggle */}
                        <div className={`overflow-hidden transition-all duration-300 ${requests.type === 'one-way' ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <label className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasDestination ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                    {hasDestination && <ChevronDown className="w-4 h-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={hasDestination}
                                    onChange={(e) => onToggleDestination(e.target.checked)}
                                    className="hidden"
                                />
                                <span className={`text-sm font-bold ${hasDestination ? 'text-blue-700' : 'text-gray-500'}`}>目的地を指定する</span>
                            </label>
                        </div>
                        {/* Pin Hint */}
                        <div className="flex items-center justify-center gap-1 mt-1 mb-1 text-xs text-gray-400">
                            <div className="flex gap-0.5">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                <MapPin className="w-3 h-3 text-red-500" />
                            </div>
                            <span>ピンをドラッグして地点を調整できます</span>
                        </div>
                    </div>


                    {/* Preferences */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-500" />
                            優先条件
                        </label>
                        <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                {preferencesList.map((pref) => (
                                    <label key={pref.key}
                                        className={`
                                            relative flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2
                                            ${requests.preferences[pref.key as keyof typeof requests.preferences]
                                                ? `border-${pref.color}-500 bg-${pref.color}-50 shadow-md`
                                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400 grayscale'}
                                        `}
                                    >
                                        <div className={`
                                            p-1.5 rounded-lg 
                                            ${requests.preferences[pref.key as keyof typeof requests.preferences]
                                                ? `bg-${pref.color}-500 text-white shadow-sm`
                                                : 'bg-gray-100 text-gray-400'}
                                        `}>
                                            {pref.icon}
                                        </div>
                                        <span className={`text-xs font-bold ${requests.preferences[pref.key as keyof typeof requests.preferences] ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {pref.label}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={!!requests.preferences[pref.key as keyof typeof requests.preferences]}
                                            onChange={() => togglePreference(pref.key as keyof typeof requests.preferences)}
                                            className="hidden"
                                        />
                                    </label>
                                ))}
                            </div>

                            <label className="flex items-center gap-3 p-3 mt-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${requests.avoidRepetition ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                    {requests.avoidRepetition && <ChevronDown className="w-4 h-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={requests.avoidRepetition}
                                    onChange={(e) => onChange({ ...requests, avoidRepetition: e.target.checked })}
                                    className="hidden"
                                />
                                <span className="text-xs text-gray-600 font-medium">できるだけ同じ道を通らない</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 mb-2">
                        <p className="text-[10px] text-gray-400 text-center">
                            ※条件を増やしすぎると、希望の目標距離にならない場合があります
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            onOpenChange(false);
                            onGenerate();
                        }}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform active:scale-[0.98] ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <RotateCw className="w-5 h-5 animate-spin" />
                                ルート生成中...
                            </span>
                        ) : (
                            'ルートを検索'
                        )}
                    </button>

                </div>
            </div >
        </>
    );
};

export default RoutePlanner;
