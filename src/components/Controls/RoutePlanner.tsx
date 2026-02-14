import React from 'react';
import { Settings, Map as MapIcon, RotateCw, Navigation, ChevronDown, Trees, Building2, Zap, VolumeX, Octagon, Activity, CornerUpRight } from 'lucide-react';
import type { RouteRequest } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageToggle from '../UI/LanguageToggle';

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
    const { t } = useLanguage();

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
        { key: 'scenery', label: t('scenery'), icon: <Trees className="w-4 h-4" />, color: 'blue' },
        { key: 'urban', label: t('urban'), icon: <Building2 className="w-4 h-4" />, color: 'blue' },
        { key: 'safety', label: t('safety'), icon: <Zap className="w-4 h-4" />, color: 'blue' },
        { key: 'quiet', label: t('quiet'), icon: <VolumeX className="w-4 h-4" />, color: 'blue' },
        { key: 'fewLights', label: t('fewLights'), icon: <Octagon className="w-4 h-4" />, color: 'blue' },
        { key: 'flat', label: t('flat'), icon: <Activity className="w-4 h-4" />, color: 'blue' },
        { key: 'minimizeTurns', label: t('minimizeTurns'), icon: <CornerUpRight className="w-4 h-4" />, color: 'blue' },
    ];

    return (
        <>
            {/* Mobile Toggle Button - Hidden if Route exists (handled by RouteDetails) UNLESS open (Close button). ALSO hidden if loading. */}
            {(isOpen || !hasRoute) && !isLoading && (
                <button
                    onClick={() => onOpenChange(!isOpen)}
                    className={`
                        md:hidden fixed right-6 z-[1100] w-14 h-14 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white active:scale-90 transition-all duration-300
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
                fixed bottom-0 left-0 w-full z-[1000] rounded-t-3xl p-6
                ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 md:translate-y-0 md:opacity-100'}
            `}>
                {/* Mobile Drag Handle */}
                <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" onClick={() => onOpenChange(false)} />

                <div className="flex items-center justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MapIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            {t('appTitle')} <span className="text-sm font-medium text-gray-500">{t('appSubtitle')}</span>
                        </h1>
                    </div>
                    <LanguageToggle />
                </div>

                <div className="space-y-5 max-h-[70vh] md:max-h-none overflow-y-auto scrollbar-hide pb-20 md:pb-0 relative">


                    {/* Distance Slider */}
                    <div className="px-4">
                        <div className="flex justify-between items-end mb-4">
                            <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-blue-500" />
                                {t('targetDistance')}
                            </label>
                            <span className="text-3xl font-black text-blue-600 tracking-tight">
                                {requests.distance.toFixed(1)}
                                <span className="text-sm text-gray-400 font-medium ml-1">km</span>
                            </span>
                        </div>
                        <style>{`
                            .range-slider::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: white;
                                border: 2px solid #2563eb;
                                cursor: pointer;
                                margin-top: -4px; /* Center thumb on track */
                                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                transition: transform 0.1s;
                            }
                            .range-slider::-webkit-slider-thumb:active {
                                transform: scale(1.1);
                            }
                            .range-slider::-webkit-slider-runnable-track {
                                width: 100%;
                                height: 12px;
                                cursor: pointer;
                                border-radius: 9999px;
                                /* Background is handled by inline style */
                            }
                        `}</style>
                        <input
                            type="range"
                            min="1.0"
                            max="42"
                            step="0.5"
                            value={requests.distance === 42.195 ? 42 : requests.distance}
                            onChange={handleDistanceChange}
                            disabled={isLoading}
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #4f46e5 ${((requests.distance === 42.195 ? 42 : requests.distance) - 1) / (42 - 1) * 100}%, #e5e7eb ${((requests.distance === 42.195 ? 42 : requests.distance) - 1) / (42 - 1) * 100}%, #e5e7eb 100%)`
                            }}
                            className={`range-slider w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 touch-none ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
                            <span>1.0 km</span>
                            <span>42.195 km</span>
                        </div>
                    </div>

                    {/* Route Type Selection */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-blue-500" />
                            {t('routeType')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onChange({ ...requests, type: 'loop' })}
                                disabled={isLoading}
                                className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 h-auto ${requests.type === 'loop'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-1 whitespace-pre-line text-center leading-tight">
                                    <RotateCw className={`w-5 h-5 ${requests.type === 'loop' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {t('loop')}
                                </div>
                            </button>
                            <button
                                onClick={() => { onChange({ ...requests, type: 'one-way' }); onOpenChange(true); }}
                                disabled={isLoading}
                                className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 h-auto ${requests.type === 'one-way'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-1 whitespace-pre-line text-center leading-tight">
                                    <Navigation className={`w-5 h-5 ${requests.type === 'one-way' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {t('oneWay')}
                                </div>
                            </button>
                        </div>

                        {/* Destination Input (One-way only) */}
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${requests.type === 'one-way' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={hasDestination}
                                            onChange={(e) => onToggleDestination(e.target.checked)}
                                            disabled={isLoading}
                                            className="peer sr-only"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{t('destination')}</span>
                                </label>
                                <p className="mt-2 text-xs text-gray-400 ml-1">
                                    {hasDestination
                                        ? t('destinationHintOn')
                                        : t('destinationHintOff')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-500" />
                            {t('preferences')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {preferencesList.map((pref) => (
                                <button
                                    key={pref.key}
                                    onClick={() => togglePreference(pref.key as keyof typeof requests.preferences)}
                                    disabled={isLoading}
                                    className={`
                                    flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-bold text-left h-auto min-h-[44px] leading-tight
                                    ${requests.preferences[pref.key as keyof typeof requests.preferences]
                                            ? `bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100`
                                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                >
                                    <span className={`shrink-0 ${requests.preferences[pref.key as keyof typeof requests.preferences] ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {pref.icon}
                                    </span>
                                    {pref.label}
                                </button>
                            ))}
                        </div>

                        <label className="flex items-center gap-3 p-3 mt-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${requests.avoidRepetition ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                {requests.avoidRepetition && <ChevronDown className="w-4 h-4 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={requests.avoidRepetition}
                                onChange={(e) => onChange({ ...requests, avoidRepetition: e.target.checked })}
                                disabled={isLoading}
                                className="hidden"
                            />
                            <span className="text-xs text-gray-600 font-medium leading-tight">{t('avoidRepetition')}</span>
                        </label>
                    </div>

                    <div className="mt-4 mb-2">
                        <p className="text-[10px] text-gray-400 text-center">
                            {t('warningComplexity')}
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
                                {t('searching')}
                            </span>
                        ) : (
                            t('searchButton')
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default RoutePlanner;

