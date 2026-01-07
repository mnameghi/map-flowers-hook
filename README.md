# Map Flowers Hook 🌸

[![npm version](https://img.shields.io/npm/v/@mnameghi/map-flowers-hook.svg)](https://www.npmjs.com/package/@mnameghi/map-flowers-hook)
[![CI/CD](https://github.com/mnameghi/map-flowers-hook/workflows/CI/badge.svg)](https://github.com/mnameghi/map-flowers-hook/actions)

A React hook for adding flower layers to MapLibre GL JS and MapBox GL JS maps. Flowers appear randomly on the map and disappear with animations when hovered.

## Features

- 🌺 Random flower placement on map bounds
- ✨ Smooth hover animations (rotation, scaling, opacity)
- 📅 Seasonal display with date range support
- 🎨 Customizable flower icons and scaling
- 🗺️ Compatible with both MapLibre GL JS and MapBox GL JS
- ⚡ Lightweight and performant

## Installation

```bash
npm install map-flowers-hook
```

```bash
yarn add map-flowers-hook
```

```bash
pnpm add map-flowers-hook
```

## Usage

### Basic Example

```tsx
import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { useFlowersLayer } from "@mnameghi/map-flowers-hook";

function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 2,
    });

    setMap(mapInstance);

    return () => mapInstance.remove();
  }, []);

  // Add flowers to the map
  useFlowersLayer(map, {
    count: 15,
    flowerScale: { min: 0.5, max: 1.2 },
  });

  return <div ref={mapContainer} style={{ height: "400px", width: "100%" }} />;
}
```

### Seasonal Flowers

Display flowers only during specific date ranges:

```tsx
useFlowersLayer(map, {
  count: 20,
  startDate: "03-20 00:00", // March 20th
  endDate: "06-21 23:59", // June 21st
  iconData: "/path/to/spring-flower.png",
});
```

### Custom Icon

```tsx
useFlowersLayer(map, {
  count: 10,
  iconData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", // Base64 image
  flowerScale: { min: 0.3, max: 0.8 },
});
```

## API Reference

### `useFlowersLayer(map, options)`

#### Parameters

| Parameter | Type                     | Default | Description                     |
| --------- | ------------------------ | ------- | ------------------------------- |
| `map`     | `SupportedMap \| null`   | -       | MapLibre or MapBox map instance |
| `options` | `UseFlowersLayerOptions` | `{}`    | Configuration options           |

#### Options

| Option        | Type          | Default              | Description                     |
| ------------- | ------------- | -------------------- | ------------------------------- |
| `sourceId`    | `string`      | `'flowers-source'`   | GeoJSON source identifier       |
| `layerId`     | `string`      | `'flowers-layer'`    | Map layer identifier            |
| `iconName`    | `string`      | `'flower-icon'`      | Icon name for the map           |
| `iconData`    | `string`      | Built-in blossom     | Icon URL or base64 data         |
| `count`       | `number`      | `10`                 | Number of flowers to display    |
| `flowerScale` | `FlowerScale` | `{min: 0.3, max: 1}` | Scale range for flowers         |
| `startDate`   | `string`      | -                    | Start date (MM-DD HH:MM format) |
| `endDate`     | `string`      | -                    | End date (MM-DD HH:MM format)   |

#### Types

```typescript
type FlowerScale = {
  min: number;
  max: number;
};

type UseFlowersLayerOptions = {
  sourceId?: string;
  layerId?: string;
  iconName?: string;
  count?: number;
  iconData?: string;
  flowerScale?: FlowerScale;
  startDate?: string;
  endDate?: string;
};
```

## Behavior

- **Random Placement**: Flowers are randomly positioned within the current map bounds
- **Hover Animation**: When hovered, flowers rotate, scale down, and fade out over 30 frames
- **Auto Replacement**: After animation completes, flowers are replaced with new ones
- **Map Movement**: New flowers are generated when the map view changes
- **Seasonal Control**: Flowers only appear during specified date ranges (if configured)

## Peer Dependencies

- `react` >= 16.8.0
- `maplibre-gl` >= 3.0.0 OR `mapbox-gl` >= 2.0.0

## Browser Support

Works in all modern browsers that support:

- ES2015+ features
- Canvas API
- WebGL
- RequestAnimationFrame

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0

- Initial release
- Basic flower layer functionality
- Hover animations
- Seasonal date range support
- MapLibre and MapBox compatibility
