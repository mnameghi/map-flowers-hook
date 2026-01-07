import { useEffect, useRef, useCallback } from "react";
import {
  FlowerCollection,
  UseFlowersLayerOptions,
  SupportedMap,
  SupportedGeoJSONSource,
} from "./types";
import { debounce, isActive, randomBetween, randomPointInBBox } from "./utils";
import {
  DEFAULT_BLOSSOM_ICON,
  ICON_NAME,
  LAYER_ID,
  SOURCE_ID,
} from "./definitions";

/**
 * React hook for adding flower layers to MapLibre GL JS and MapBox GL JS maps.
 * Flowers appear on the map at random positions. When hovered, they hide with animated rotation, scaling, and opacity effects.
 * This hook can active only in the specified date range. If no date range is specified, it will always be active.
 * For example, to display flowers from June 1st to August 1st, you can use: `startDate='06-01 08:20' endDate='08-01 08:20'`
 *
 * @param map - The MapLibre or MapBox map instance
 * @param options.sourceId - GeoJSON source identifier (default: 'flowers-source')
 * @param options.layerId - Map layer identifier (default: 'flowers-layer')
 * @param options.iconName - Icon name for the map (default: 'flower-icon')
 * @param options.iconData - Icon URL or base64 data (default: built-in blossom icon)
 * @param options.count - Number of flowers to display (default: 10)
 * @param options.flowerScale - Scale range for flowers (default: {min: 0.3, max: 1})
 * @param options.startDate - Start date for seasonal display.
 * @param options.endDate - End date for seasonal display
 *
 * @example
 * ```tsx
 * import { useFlowersLayer } from 'maplibre-flowers-hook';
 *
 * function MapComponent() {
 *   const [map, setMap] = useState<maplibregl.Map | null>(null);
 *
 *   useFlowersLayer(map, {
 *     count: 15,
 *     iconData: 'path/to/flower-icon.png'
 *   });
 *
 *   return <div ref={mapContainer} style={{ height: '400px' }} />;
 * }
 * ```
 */
export function useFlowersLayer(
  map: SupportedMap | null,
  options: UseFlowersLayerOptions = {}
) {
  const {
    sourceId = SOURCE_ID,
    layerId = LAYER_ID,
    iconName = ICON_NAME,
    iconData = DEFAULT_BLOSSOM_ICON,
    count = 10,
    flowerScale = { min: 0.3, max: 1 },
    startDate,
    endDate,
  } = options;

  const dataRef = useRef<FlowerCollection | null>(null);

  const createFlowerFeature = useCallback(
    (map: SupportedMap) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: randomPointInBBox(map.getBounds().toArray().flat()),
      },
      properties: {
        id: crypto?.randomUUID?.() ?? Math.random().toString(36),
        rotation: 0,
        opacity: 1,
        scale: randomBetween(flowerScale.min, flowerScale.max),
        animating: false,
      },
    }),
    [flowerScale]
  );

  const generatePoints = useCallback(
    (map: SupportedMap, count: number): FlowerCollection => ({
      type: "FeatureCollection",
      features: Array.from({ length: count }, () => createFlowerFeature(map)),
    }),
    [createFlowerFeature]
  );

  const loadIcon = useCallback(async () => {
    if (!map || map.hasImage(iconName)) return;

    const iconSrc = iconData || DEFAULT_BLOSSOM_ICON;
    try {
      if (iconSrc.startsWith("data:")) {
        const img = new Image();
        img.onload = () => map.addImage(iconName, img);
        img.onerror = () => console.error("Failed to load base64 icon");
        img.src = iconSrc;
      } else {
        const res = await fetch(iconSrc);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);
        map.addImage(iconName, bitmap);
      }
    } catch (error) {
      console.error("Failed to load icon:", error);
    }
  }, [map, iconName, iconData]);

  const setupMapLayers = useCallback(() => {
    if (!map) return;

    if (!map.getSource(sourceId)) {
      const data = generatePoints(map, count);
      dataRef.current = data;
      map.addSource(sourceId, { type: "geojson", data });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "symbol",
        source: sourceId,
        layout: {
          "icon-image": iconName,
          "icon-size": ["get", "scale"],
          "icon-rotate": ["get", "rotation"],
          "icon-allow-overlap": true,
        },
      });
    }
  }, [map, sourceId, layerId, iconName, generatePoints, count]);

  const createNewFlower = useCallback(
    (map: SupportedMap) => createFlowerFeature(map),
    [createFlowerFeature]
  );

  const replaceFlower = useCallback(
    (
      data: FlowerCollection,
      id: string,
      source: SupportedGeoJSONSource<FlowerCollection>
    ) => {
      const nextFeatures = data.features.filter((f) => f.properties?.id !== id);

      nextFeatures.push(createNewFlower(map!));

      const nextData: FlowerCollection = {
        ...data,
        features: nextFeatures,
      };

      dataRef.current = nextData;
      source.setData(nextData);
    },
    [createNewFlower, map]
  );

  const animateFlower = useCallback(
    (
      feature: any,
      source: SupportedGeoJSONSource<FlowerCollection>,
      data: FlowerCollection
    ) => {
      const initialScale = feature.properties.scale;
      let frame = 0;

      const step = () => {
        frame++;

        feature.properties = {
          ...feature.properties,
          rotation: feature.properties.rotation + 15,
          opacity: 1 - frame / 30,
          scale: initialScale * (1 - frame / 30),
        };

        source.setData(data);

        if (frame < 30) {
          requestAnimationFrame(step);
        } else {
          replaceFlower(data, feature.properties.id, source);
        }
      };

      step();
    },
    [replaceFlower]
  );

  const animateAndReplace = useCallback(
    (id: string) => {
      if (!map || !dataRef.current) return;

      const source = map.getSource(sourceId);
      if (!source || !source.setData) return;

      const data = dataRef.current;
      const feature = data.features.find(
        (f: { properties?: { id?: string } }) => f.properties?.id === id
      );

      if (!feature || feature.properties.animating) return;

      feature.properties.animating = true;
      animateFlower(feature, source, dataRef.current);
    },
    [map, sourceId, animateFlower]
  );

  useEffect(() => {
    if (!map || !isActive(startDate, endDate)) return;

    const handleHover = debounce((e: any) => {
      if (!map.getLayer(layerId)) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerId],
      });
      const feature = features[0];

      if (feature?.properties && !feature.properties.animating) {
        animateAndReplace(feature.properties.id);
      }
    }, 80);

    const handleMoveEnd = () => {
      if (!dataRef.current) return;
      const source = map.getSource(sourceId);
      if (!source || !source.setData) return;

      const data = generatePoints(map, count);
      dataRef.current = data;
      source.setData(data);
    };

    const setupMap = async () => {
      await loadIcon();
      setupMapLayers();
    };

    try {
      if (map.isStyleLoaded?.() !== false) {
        setupMap();
      } else {
        map.once("load", setupMap);
      }

      map.on("moveend", handleMoveEnd);
      map.on("mousemove", handleHover);
    } catch (e) {
      console.error("Error setting up map flower:", e);
    }

    return () => {
      map.off("mousemove", handleHover);
      map.off("moveend", handleMoveEnd);
    };
  }, [
    map,
    sourceId,
    layerId,
    count,
    startDate,
    endDate,
    loadIcon,
    setupMapLayers,
    animateAndReplace,
    generatePoints,
  ]);
}
