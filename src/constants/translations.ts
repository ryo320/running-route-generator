export type Language = 'ja' | 'en';

export const translations = {
    ja: {
        appTitle: 'RunRoute',
        appSubtitle: '(ランルー)',
        metaDescription: '「いつも同じ道ばかり走っている」「どこを走ればいいかわからない」そんなランナーへ。RunRouteは希望の距離と場所を指定するだけで、最適なランニングコースを自動生成します。未知なる道へ、走り出しましょう。',

        // RoutePlanner
        targetDistance: '目標距離',
        routeType: 'ルートタイプ',
        loop: 'スタート地点に戻る',
        oneWay: '片道（ゴール指定）',
        destination: '目的地を指定する',
        destinationHintOn: '地図上の赤いピンを動かして目的地を設定してください',
        destinationHintOff: 'オフの場合、指定した距離でランダムな方向へ向かいます',
        preferences: '優先条件',
        scenery: '景観 (自然)',
        urban: '景観 (都会)',
        safety: '安全 (街灯)',
        quiet: '静か (交通量少)',
        fewLights: '信号少なめ',
        flat: '平坦',
        minimizeTurns: '曲がり角少なめ',
        avoidRepetition: 'できるだけ同じ道を通らない',
        warningComplexity: '※条件を増やしすぎると、希望の目標距離にならない場合があります',
        searchButton: 'ルートを検索',
        searching: 'ルート生成中...',

        // RouteDetails
        routeDetails: 'ルート詳細',
        distanceMismatch: '⚠️ 距離が一致しませんでした',
        distanceMismatchDesc: '生成ルート ({distance}km) が目標 ({target}km) と異なります。条件が厳しすぎる可能性があります。',
        retrySameSettings: '同じ条件で再検索',
        retrySameDistance: '距離固定で再検索',
        totalDistance: '総距離',
        elevationGain: '獲得標高',
        openGoogleMaps: 'Google Mapsで開く',
        downloadGPX: 'Garmin・Strava等（GPX）',
        googleMapsNote: '※ Google Mapsはルートが再計算される場合があります。',
        gpxNote: '※ 正確なルート再現には「Garmin・Strava等」をダウンロードし、各アプリに取り込んでください。',

        // Toast / Messages
        locationError: '現在地の取得に失敗しました',
        routeCreated: 'ルートを作成しました！',
        routeNotFound: 'ルートが見つかりませんでした。',
        timeoutMessage: '検索時間を超過したため、現時点の最善ルートを表示します',
        routeGenerationFailed: 'ルートを生成できませんでした。条件を緩めて再試行してください。',
        unknownError: 'エラーが発生しました。',

        // Loading
        loadingSearching: '最適なルートを探しています...',
        loadingMapData: '地図データを取得中...',

        // Hints
        dragStartPin: '青いピンを動かしてスタート地点を変更できます',
    },
    en: {
        appTitle: 'RunRoute',
        appSubtitle: '',
        metaDescription: 'Bored of the same route? Don\'t know where to run? RunRoute generates optimal running paths based on your distance and location preferences. Discover unknown paths.',

        // RoutePlanner
        targetDistance: 'Target Distance',
        routeType: 'Route Type',
        loop: 'Loop\n(Return to Start)',
        oneWay: 'One-Way\n(Set Destination)',
        destination: 'Set Destination',
        destinationHintOn: 'Move the red pin on the map to set the destination',
        destinationHintOff: 'If off, goes in a random direction for the target distance',
        preferences: 'Preferences',
        scenery: 'Scenery (Nature)',
        urban: 'Scenery (Urban)',
        safety: 'Safety (Lit)',
        quiet: 'Quiet (Low Traffic)',
        fewLights: 'Few Lights',
        flat: 'Flat',
        minimizeTurns: 'Minimize Turns',
        avoidRepetition: 'Avoid Repetition',
        warningComplexity: '* Too many conditions may result in a distance mismatch',
        searchButton: 'Generate Route',
        searching: 'Generating...',

        // RouteDetails
        routeDetails: 'Route Details',
        distanceMismatch: '⚠️ Distance Mismatch',
        distanceMismatchDesc: 'Generated route ({distance}km) differs from target ({target}km). Conditions might be too strict.',
        retrySameSettings: 'Retry (Same Settings)',
        retrySameDistance: 'Retry (Same Distance)',
        totalDistance: 'Total Distance',
        elevationGain: 'Elevation Gain',
        openGoogleMaps: 'Open in Google Maps',
        downloadGPX: 'Garmin/Strava (GPX)',
        googleMapsNote: '* Google Maps may recalculate the route.',
        gpxNote: '* For exact route reproduction, download GPX and import into your app.',

        // Toast / Messages
        locationError: 'Failed to get current location',
        routeCreated: 'Route created!',
        routeNotFound: 'No route found.',
        timeoutMessage: 'Search timed out. Showing best route found so far.',
        routeGenerationFailed: 'Failed to generate route. Please relax conditions.',
        unknownError: 'An error occurred.',

        // Loading
        loadingSearching: 'Searching for optimal route...',
        loadingMapData: 'Acquiring map data...',

        // Hints
        dragStartPin: 'Drag the blue pin to change start location',
    }
};
