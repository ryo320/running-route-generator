import React from 'react';
import type { Route } from '../../types';
import { Navigation, TrendingUp, RefreshCw } from 'lucide-react';

interface RouteDetailsProps {
    route: Route;
    targetDistance?: number;
    onRetrySameSettings?: () => void;
    onRetrySameDistance?: () => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
    route,
    targetDistance,
    onRetrySameSettings,
    onRetrySameDistance
}) => {

    // Check if distance error is significant (> 1km or > 15%)
    const isApproximate = targetDistance
        ? Math.abs(route.distance - targetDistance) > Math.max(1.0, targetDistance * 0.15)
        : false;

    const handleExportGoogleMaps = () => {
        if (!route.waypoints || route.waypoints.length < 2) return;

        const origin = route.waypoints[0];
        const destination = route.waypoints[route.waypoints.length - 1];
        const waypoints = route.waypoints.slice(1, -1);

        let url = `https://www.google.com/maps/dir/?api=1`;
        url += `&origin=${origin.lat},${origin.lng}`;
        url += `&destination=${destination.lat},${destination.lng}`;

        if (waypoints.length > 0) {
            const waypointsStr = waypoints.map(p => `${p.lat},${p.lng}`).join('|');
            url += `&waypoints=${waypointsStr}`;
        }

        url += `&travelmode=walking`; // Run mode not explicit, walking is closest

        window.open(url, '_blank');
    };

    return (
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                ルート詳細
            </h3>

            {isApproximate && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    <p className="font-bold mb-1">⚠️ 距離が一致しませんでした</p>
                    <p>
                        生成ルート ({route.distance.toFixed(1)}km) が目標 ({targetDistance}km) と異なります。
                        条件が厳しすぎる可能性があります。
                    </p>
                </div>
            )}

            {/* Re-roll Options */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                {onRetrySameSettings && (
                    <button
                        onClick={onRetrySameSettings}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200"
                    >
                        <RefreshCw className="w-3 h-3" />
                        同じ条件で再検索
                    </button>
                )}
                {onRetrySameDistance && (
                    <button
                        onClick={onRetrySameDistance}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200"
                    >
                        <RefreshCw className="w-3 h-3" />
                        距離固定で再検索
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">総距離</p>
                    <p className="text-2xl font-bold text-gray-900">{route.distance.toFixed(2)} km</p>
                </div>
                {route.elevationGain !== undefined && (
                    <div className="text-center border-l border-gray-200 pl-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">獲得標高</p>
                        <p className="text-2xl font-bold text-gray-900">{route.elevationGain} m</p>
                    </div>
                )}
            </div>

            <button
                onClick={handleExportGoogleMaps}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <Navigation className="w-5 h-5" />
                Google Mapsで開く
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
                ※ Google Maps側でルートが再計算される場合があります。
            </p>
        </div>
    );
};

export default RouteDetails;
