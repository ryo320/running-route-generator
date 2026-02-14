import type { Route } from '../types';

export const generateGPX = (route: Route): string => {
    const timestamp = new Date().toISOString();
    const name = `RunRoute - ${route.distance.toFixed(1)}km`;

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunRoute Code" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
`;

    route.coordinates.forEach(coord => {
        gpx += `      <trkpt lat="${coord.lat}" lon="${coord.lng}">\n`;
        // Add elevation if available (future improvement)
        gpx += `      </trkpt>\n`;
    });

    gpx += `    </trkseg>
  </trk>
</gpx>`;

    return gpx;
};

export const downloadGPX = (route: Route) => {
    const gpxContent = generateGPX(route);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `runroute-${new Date().toISOString().slice(0, 10)}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
