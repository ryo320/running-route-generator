import React, { useState, useRef, useEffect } from 'react';
import type { Route } from '../../types';
import { Navigation, TrendingUp, RefreshCw, Download, Settings } from 'lucide-react';
import { detectTurnPoints } from '../../utils/geoUtils';
import { downloadGPX } from '../../utils/gpxUtils';

interface RouteDetailsProps {
    route: Route;
    targetDistance?: number;
    onRetrySameSettings?: () => void;
    onRetrySameDistance?: () => void;
    onOpenSettings?: () => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
    route,
    targetDistance,
    onRetrySameSettings,
    onRetrySameDistance,
    onOpenSettings
}) => {
    // --- Swipeable Bottom Sheet Logic ---
    const [isExpanded, setIsExpanded] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [sheetHeight, setSheetHeight] = useState(0);

    // Check if distance error is significant (> 1km or > 15%)
    const isApproximate = targetDistance
        ? Math.abs(route.distance - targetDistance) > Math.max(1.0, targetDistance * 0.15)
        : false;

    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const isDragging = useRef(false);

    const [peekHeight, setPeekHeight] = useState(160); // Default, updated by ref
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sheetRef.current) {
            setSheetHeight(sheetRef.current.offsetHeight);
        }
        if (headerRef.current) {
            // Add some padding/margin to the measured height if needed
            setPeekHeight(headerRef.current.offsetHeight + 10);
        }
    }, [route, isApproximate]);

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        // e.preventDefault(); // Warning: React might complain about passive events if not careful, but usually okay in handler if simple.
        isDragging.current = true;
        startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.stopPropagation();
        // e.preventDefault() is often needed to stop scrolling, but in React 18+ passive is default.
        // We rely on CSS touch-action: none for the handle.
        if (!isDragging.current || startY.current === null) return;
        const deltaY = e.touches[0].clientY - startY.current;
        setDragOffset(deltaY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        isDragging.current = false;
        if (startY.current === null) return;

        const threshold = 50;

        if (isExpanded) {
            if (dragOffset > threshold) setIsExpanded(false);
        } else {
            if (dragOffset < -threshold) setIsExpanded(true);
        }

        setDragOffset(0);
        startY.current = null;
    };

    // Calculate Transform
    const collapsedTranslate = Math.max(0, sheetHeight - peekHeight);

    const currentTranslate = isExpanded ? 0 : collapsedTranslate;
    const totalTranslate = Math.max(0, currentTranslate + dragOffset);

    // --- End Swipe Logic ---

    const handleExportGoogleMaps = () => {
        if (!route.coordinates || route.coordinates.length < 2) return;

        const origin = route.coordinates[0];
        const destination = route.coordinates[route.coordinates.length - 1];

        // Detect significant turns to use as waypoints.
        // Google Maps URL has a limit (approx 10-15 waypoints + origin/dest).
        // Use a higher threshold (60 degrees) to pick only major corners.
        const waypoints = detectTurnPoints(route.coordinates, 9, 60);

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
        <div
            ref={sheetRef}
            className={`
                bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-white/20 
                
                /* Desktop: Absolute card in top-right */
                md:absolute md:top-8 md:right-8 md:w-80 md:rounded-2xl md:transform-none md:inset-auto md:h-auto md:max-h-none md:overflow-visible
                
                /* Mobile: Fixed bottom sheet, AUTO height */
                fixed bottom-0 left-0 w-full z-[800] rounded-t-3xl overflow-hidden h-auto
            `}
            style={{
                // Desktop: reset transform
                // Mobile: calculate transform
                transform: window.innerWidth >= 768
                    ? 'none'
                    : `translateY(${totalTranslate}px)`,
                transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            {/* Header Section (Visible when collapsed) */}
            <div ref={headerRef}>
                {/* Handle Bar Area */}
                <div
                    className="md:hidden w-full h-8 -mt-6 mb-2 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header Title Row */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        ルート詳細
                    </h3>

                    {/* Settings Button (Mobile only, inside sheet) */}
                    {onOpenSettings && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag/map issues
                                onOpenSettings();
                            }}
                            className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-all md:hidden z-50 shrink-0"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                </div>

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
                            className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200 whitespace-nowrap"
                        >
                            <RefreshCw className="w-3 h-3 flex-shrink-0" />
                            同じ条件で再検索
                        </button>
                    )}
                    {onRetrySameDistance && (
                        <button
                            onClick={onRetrySameDistance}
                            className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200 whitespace-nowrap"
                        >
                            <RefreshCw className="w-3 h-3 flex-shrink-0" />
                            距離固定で再検索
                        </button>
                    )}
                </div>
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

            <div className="flex flex-col gap-3">
                <button
                    onClick={handleExportGoogleMaps}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg"
                >
                    <Navigation className="w-6 h-6" />
                    Google Mapsで開く
                </button>
                <button
                    onClick={() => downloadGPX(route)}
                    className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-sm"
                    title="GPXファイルをダウンロード（GarminやStrava等への取込用）"
                >
                    <Download className="w-4 h-4" />
                    Garmin・Strava等（GPX）
                </button>
            </div>
            <div className="text-xs text-left text-gray-400 mt-2 space-y-1">
                <p>※ Google Mapsはルートが再計算される場合があります。</p>
                <p>※ 正確なルート再現には「Garmin・Strava等」をダウンロードし、各アプリに取り込んでください。</p>
            </div>
        </div>
    );
};

export default RouteDetails;
