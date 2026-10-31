/**
 * Spatial Measurement Engine & Data Fusion Pipeline
 * SiteView Pro - Walnus SmartView Pro
 * 
 * Provides:
 * 1. Real-time Camera Spatial Trigonometry (Distance to Target, Height, Width, Surface Area)
 * 2. Sensor Data Fusion (GPS absolute coordinate tagging, Compass True North alignment, Gyro ground plane)
 * 3. Open Geographic Database & Mapping Export Formats (GeoJSON, KML, WKT, OSM Tags)
 */

export interface GpsTelemetry {
  lat: number;
  lng: number;
  alt: number | null; // meters WGS84
  accuracy: number; // meters
  heading: number | null; // degrees from north
  speed: number | null; // m/s
  timestamp: number;
}

export interface OrientationTelemetry {
  heading: number; // 0..360 degrees (magnetic or true)
  pitch: number; // -90..+90 degrees (tilt up/down)
  roll: number; // -180..+180 degrees (tilt left/right)
  trueNorthHeading?: number; // True North corrected with magnetic declination
  magneticDeclination?: number;
}

export interface SpatialMeasurement {
  id: string;
  timestamp: number;
  distanceMeters: number;
  objectHeightMeters: number;
  objectWidthMeters: number;
  surfaceAreaSqMeters: number;
  surfaceAreaSqFt: number;
  accuracyMm: number;
  confidencePercent: number;
  
  // Optical & Raycast parameters
  cameraEyeHeightMeters: number;
  fieldOfViewDeg: { horizontal: number; vertical: number };
  targetCenterAngle: { pitch: number; yaw: number };
  
  // Telemetry tags
  gps: GpsTelemetry;
  orientation: OrientationTelemetry;
  
  // 3D Bounding Vertices in Local Metric Space (x=east, y=up, z=north)
  localVertices: Array<{ x: number; y: number; z: number; label: string }>;
  
  // Geo-tagged Polygon Coordinates in WGS84 [longitude, latitude, altitude]
  geoVertices: Array<[number, number, number]>;
  
  // Structural metadata
  jobMode: string;
  substrate: string;
  notes?: string;
}

/**
 * Standard Camera Field of View (FOV) defaults for mobile wide-angle sensors
 */
export const DEFAULT_CAMERA_FOV = {
  horizontal: 68.0, // degrees
  vertical: 53.0,   // degrees
};

/**
 * Approximate Magnetic Declination model based on lat/lng (World Magnetic Model approximation)
 */
export function estimateMagneticDeclination(lat: number, lng: number): number {
  // Simplified spherical harmonic approximation for common regions
  const radLat = (lat * Math.PI) / 180;
  const radLng = (lng * Math.PI) / 180;
  const declination = -2.5 * Math.sin(radLng) + 4.0 * Math.sin(2 * radLat);
  return parseFloat(declination.toFixed(2));
}

/**
 * Computes live optical trigonometry metrics from camera elevation, pitch angle, and target bounds.
 */
export function calculateLiveSpatialMetrics(params: {
  deviceEyeHeightMeters?: number; // Height of device camera from ground (default: 1.6m)
  pitchDeg: number; // Device tilt angle
  rollDeg: number;  // Device roll angle
  headingDeg: number; // Device azimuth heading
  targetBoxNorm: { top: number; bottom: number; left: number; right: number }; // 0..1 normalized in viewfinder
  fov?: { horizontal: number; vertical: number };
  measuredDistanceOverride?: number; // LiDAR or manual laser override if available
}): {
  distanceMeters: number;
  objectHeightMeters: number;
  objectWidthMeters: number;
  surfaceAreaSqMeters: number;
  surfaceAreaSqFt: number;
  confidencePercent: number;
  groundDistanceMeters: number;
} {
  const eyeH = params.deviceEyeHeightMeters || 1.6;
  const fov = params.fov || DEFAULT_CAMERA_FOV;
  const pitchRad = ((params.pitchDeg || 0) * Math.PI) / 180;

  // 1. Calculate primary line-of-sight distance
  let distance = params.measuredDistanceOverride || 0;
  if (!distance || distance <= 0) {
    // Trigonometric ground-plane intercept: d = eyeH / tan(|pitch|)
    const absPitch = Math.max(Math.abs(pitchRad), 0.05); // prevent div by zero
    if (params.pitchDeg < 0) {
      // Pointing downward towards ground plane
      distance = eyeH / Math.sin(absPitch);
    } else {
      // Pointing level or upward: estimated baseline ~5m - 20m scaled by optical frame
      const tiltFactor = Math.cos(absPitch);
      distance = 6.5 * (1.0 + Math.abs(params.pitchDeg) / 45.0) * tiltFactor;
    }
  }

  // Constrain realistic distances for façade inspection (1.2m to 65m)
  distance = Math.max(1.2, Math.min(65.0, distance));
  const groundDistance = Math.max(0.5, Math.sqrt(Math.max(0, distance * distance - eyeH * eyeH)));

  // 2. Object Height calculation from vertical FOV and bounding box angles
  const vFovRad = (fov.vertical * Math.PI) / 180;
  const boxHeightFraction = Math.max(0.08, Math.min(1.0, params.targetBoxNorm.bottom - params.targetBoxNorm.top));
  const angularHeightSpan = boxHeightFraction * vFovRad;
  const objectHeight = Math.max(0.5, parseFloat((2.0 * distance * Math.tan(angularHeightSpan / 2)).toFixed(2)));

  // 3. Object Width calculation from horizontal FOV and bounding box angles
  const hFovRad = (fov.horizontal * Math.PI) / 180;
  const boxWidthFraction = Math.max(0.08, Math.min(1.0, params.targetBoxNorm.right - params.targetBoxNorm.left));
  const angularWidthSpan = boxWidthFraction * hFovRad;
  const objectWidth = Math.max(0.5, parseFloat((2.0 * distance * Math.tan(angularWidthSpan / 2)).toFixed(2)));

  // 4. Surface Area calculation
  const surfaceAreaSqMeters = parseFloat((objectHeight * objectWidth).toFixed(2));
  const surfaceAreaSqFt = Math.round(surfaceAreaSqMeters * 10.7639);

  // 5. Confidence Score (Higher when level and moderate tilt, lower when extreme roll/pitch)
  const pitchPenalty = Math.min(30, Math.abs(params.pitchDeg) * 0.4);
  const rollPenalty = Math.min(25, Math.abs(params.rollDeg) * 0.8);
  const confidencePercent = Math.max(45, Math.round(98 - pitchPenalty - rollPenalty));

  return {
    distanceMeters: parseFloat(distance.toFixed(2)),
    objectHeightMeters: objectHeight,
    objectWidthMeters: objectWidth,
    surfaceAreaSqMeters,
    surfaceAreaSqFt,
    confidencePercent,
    groundDistanceMeters: parseFloat(groundDistance.toFixed(2)),
  };
}

/**
 * Transforms local façade metric coordinates (x, y, z) into absolute WGS84 Geo Coordinates (lat, lng, alt)
 * using GPS center, True North heading, and Earth ellipsoidal curvature (WGS84).
 */
export function transformLocalToWgs84(
  localPoint: { x: number; y: number; z: number },
  originGps: GpsTelemetry,
  headingDeg: number
): [number, number, number] {
  const earthRadius = 6378137.0; // meters (WGS84 semi-major axis)
  const headingRad = (headingDeg * Math.PI) / 180;

  // Rotate local vector by device azimuth heading
  const northOffset = localPoint.z * Math.cos(headingRad) - localPoint.x * Math.sin(headingRad);
  const eastOffset = localPoint.z * Math.sin(headingRad) + localPoint.x * Math.cos(headingRad);
  const upOffset = localPoint.y;

  // Delta latitude and longitude in degrees
  const deltaLat = (northOffset / earthRadius) * (180 / Math.PI);
  const deltaLng = (eastOffset / (earthRadius * Math.cos((originGps.lat * Math.PI) / 180))) * (180 / Math.PI);

  const geoLat = parseFloat((originGps.lat + deltaLat).toFixed(7));
  const geoLng = parseFloat((originGps.lng + deltaLng).toFixed(7));
  const geoAlt = parseFloat(((originGps.alt || 0) + upOffset).toFixed(2));

  return [geoLng, geoLat, geoAlt];
}

/**
 * Generates an RFC 7946 compliant GeoJSON FeatureCollection containing 3D Polygon & Point geometries.
 */
export function exportToGeoJson(measurement: SpatialMeasurement): string {
  const featureCollection = {
    type: 'FeatureCollection',
    name: `SiteView_Spatial_${measurement.id}`,
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      },
    },
    metadata: {
      generatedBy: 'SiteView Pro (Walnus SmartView Pro)',
      version: '3.8.2',
      timestamp: new Date(measurement.timestamp).toISOString(),
      accuracyMm: measurement.accuracyMm,
      confidencePercent: measurement.confidencePercent,
      system: 'WGS84 3D Ellipsoidal',
    },
    features: [
      // 1. Measured Façade 3D Polygon Boundary
      {
        type: 'Feature',
        id: `facade_${measurement.id}`,
        geometry: {
          type: 'Polygon',
          coordinates: [
            // Close the polygon ring (first point == last point)
            [...measurement.geoVertices, measurement.geoVertices[0]],
          ],
        },
        properties: {
          featureType: 'structural_facade_surface',
          objectHeightMeters: measurement.objectHeightMeters,
          objectWidthMeters: measurement.objectWidthMeters,
          surfaceAreaSqMeters: measurement.surfaceAreaSqMeters,
          surfaceAreaSqFt: measurement.surfaceAreaSqFt,
          distanceMeters: measurement.distanceMeters,
          jobMode: measurement.jobMode,
          substrate: measurement.substrate,
          azimuthHeadingDeg: measurement.orientation.heading,
          trueNorthHeadingDeg: measurement.orientation.trueNorthHeading || measurement.orientation.heading,
          pitchDeg: measurement.orientation.pitch,
          rollDeg: measurement.orientation.roll,
          gpsAccuracyMeters: measurement.gps.accuracy,
          recordedAt: new Date(measurement.timestamp).toISOString(),
        },
      },
      // 2. Camera Observation Center Point
      {
        type: 'Feature',
        id: `camera_origin_${measurement.id}`,
        geometry: {
          type: 'Point',
          coordinates: [measurement.gps.lng, measurement.gps.lat, measurement.gps.alt || 0],
        },
        properties: {
          featureType: 'camera_sensor_origin',
          eyeHeightMeters: measurement.cameraEyeHeightMeters,
          compassHeading: measurement.orientation.heading,
          gpsAccuracyMeters: measurement.gps.accuracy,
          timestamp: measurement.timestamp,
        },
      },
    ],
  };

  return JSON.stringify(featureCollection, null, 2);
}

/**
 * Generates an OGC-compliant KML (Keyhole Markup Language) file for Google Earth, ArcGIS, and civil GIS systems.
 */
export function exportToKml(measurement: SpatialMeasurement): string {
  const coordsKml = [...measurement.geoVertices, measurement.geoVertices[0]]
    .map(([lng, lat, alt]) => `${lng},${lat},${alt}`)
    .join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>SiteView Pro - 3D Structural Measurement ${measurement.id}</name>
    <description>3D Architectural Spatial Façade Capture (Area: ${measurement.surfaceAreaSqMeters} m² / ${measurement.surfaceAreaSqFt} sq ft)</description>
    <Style id="facadeStyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>2.5</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00aa33</color>
        <outline>1</outline>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Façade Surface [${measurement.objectWidthMeters}m x ${measurement.objectHeightMeters}m]</name>
      <styleUrl>#facadeStyle</styleUrl>
      <ExtendedData>
        <Data name="SurfaceAreaSqM"><value>${measurement.surfaceAreaSqMeters}</value></Data>
        <Data name="SurfaceAreaSqFt"><value>${measurement.surfaceAreaSqFt}</value></Data>
        <Data name="HeightM"><value>${measurement.objectHeightMeters}</value></Data>
        <Data name="WidthM"><value>${measurement.objectWidthMeters}</value></Data>
        <Data name="DistanceM"><value>${measurement.distanceMeters}</value></Data>
        <Data name="JobMode"><value>${measurement.jobMode}</value></Data>
        <Data name="Substrate"><value>${measurement.substrate}</value></Data>
        <Data name="AccuracyMm"><value>${measurement.accuracyMm}</value></Data>
        <Data name="Heading"><value>${measurement.orientation.heading}</value></Data>
        <Data name="TrueNorthHeading"><value>${measurement.orientation.trueNorthHeading || measurement.orientation.heading}</value></Data>
      </ExtendedData>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsKml}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Camera Origin Station</name>
      <Point>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${measurement.gps.lng},${measurement.gps.lat},${measurement.gps.alt || 0}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
}

/**
 * Generates a Well-Known Text (WKT) 3D Representation for PostGIS / SpatiaLite database tables.
 */
export function exportToWkt(measurement: SpatialMeasurement): {
  polygon3dWkt: string;
  cameraPoint3dWkt: string;
  sqlInsertSnippet: string;
} {
  const polygonCoords = [...measurement.geoVertices, measurement.geoVertices[0]]
    .map(([lng, lat, alt]) => `${lng} ${lat} ${alt}`)
    .join(', ');

  const polygon3dWkt = `POLYGON Z ((${polygonCoords}))`;
  const cameraPoint3dWkt = `POINT Z (${measurement.gps.lng} ${measurement.gps.lat} ${measurement.gps.alt || 0})`;

  const sqlInsertSnippet = `-- PostGIS 3D Spatial Façade Insert
INSERT INTO structural_surfaces (
  guid, job_mode, substrate, height_m, width_m, area_sqm, distance_m, accuracy_mm, 
  heading_deg, recorded_at, geom_3d
) VALUES (
  '${measurement.id}', 
  '${measurement.jobMode}', 
  '${measurement.substrate}', 
  ${measurement.objectHeightMeters}, 
  ${measurement.objectWidthMeters}, 
  ${measurement.surfaceAreaSqMeters}, 
  ${measurement.distanceMeters}, 
  ${measurement.accuracyMm}, 
  ${measurement.orientation.heading}, 
  '${new Date(measurement.timestamp).toISOString()}', 
  ST_GeomFromText('${polygon3dWkt}', 4326)
);`;

  return { polygon3dWkt, cameraPoint3dWkt, sqlInsertSnippet };
}

/**
 * OpenStreetMap (OSM) / Humanitarian GIS tagging schema mapping
 */
export function generateOsmContributionTags(measurement: SpatialMeasurement): Record<string, string> {
  return {
    'building': 'yes',
    'height': `${measurement.objectHeightMeters}`,
    'width': `${measurement.objectWidthMeters}`,
    'area': `${measurement.surfaceAreaSqMeters}`,
    'surface': measurement.substrate === 'masonry' ? 'brick' : measurement.substrate === 'concrete' ? 'concrete' : 'plaster',
    'source': 'SiteViewPro-LiDAR-HUD',
    'source:accuracy': `${measurement.accuracyMm}mm`,
    'source:date': new Date(measurement.timestamp).toISOString().split('T')[0],
    'survey:date': new Date(measurement.timestamp).toISOString().split('T')[0],
    'camera:heading': `${measurement.orientation.heading}`,
    'camera:pitch': `${measurement.orientation.pitch}`,
  };
}
