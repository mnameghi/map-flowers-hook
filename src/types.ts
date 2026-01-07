// Support both MapBox and MapLibre map types
export type SupportedMap = {
  hasImage: (name: string) => boolean;
  addImage: (name: string, image: any) => void;
  removeImage: (name: string) => void;
  getSource: (id: string) => any;
  addSource: (id: string, source: any) => void;
  getLayer: (id: string) => any;
  addLayer: (layer: any) => void;
  isStyleLoaded: () => boolean | void;
  once: (event: string, callback: () => void) => void;
  on: (event: string, callback: (e: any) => void) => void;
  off: (event: string, callback: (e: any) => void) => void;
  queryRenderedFeatures: (point: any, options?: any) => any[];
  getBounds: () => { toArray: () => number[][] };
};

export type SupportedGeoJSONSource<T = any> = {
  setData: (data: T) => void;
};

export type FlowerProps = {
  rotation: number;
  opacity: number;
  scale: number;
  animating?: boolean;
  id: string;
};

export type FlowerCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: FlowerProps;
  }>;
};

export type FlowerScale = {
  min: number;
  max: number;
};

export type UseFlowersLayerOptions = {
  sourceId?: string;
  layerId?: string;
  iconName?: string;
  count?: number;
  iconData?: string;
  flowerScale?: FlowerScale;
  startDate?: string;
  endDate?: string;
};
