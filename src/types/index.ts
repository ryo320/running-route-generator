export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Route {
    id: string;
    coordinates: Coordinates[];
    distance: number; // in kilometers
    elevationGain?: number; // in meters
    waypoints?: Coordinates[];
    turnCount?: number;
}

export interface RouteRequest {
    start: Coordinates;
    destination?: Coordinates; // 目的地（片道の場合のオプション）
    distance: number; // in kilometers
    type: 'loop' | 'one-way' | 'destination';
    preferences: {
        scenery: boolean;
        safety: boolean;
        flat: boolean;
        quiet: boolean;     // 交通量が少ない・静か
        fewLights: boolean; // 信号が少ない
        urban: boolean;     // 都会の景観（ビルの明かり）
        minimizeTurns: boolean; // 曲がる回数を減らす
    };
    avoidRepetition: boolean; // 同じ道を通らない
}
