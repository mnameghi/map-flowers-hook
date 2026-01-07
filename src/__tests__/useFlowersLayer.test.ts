import { renderHook, waitFor } from "@testing-library/react";
import { useFlowersLayer } from "../useFlowersLayer";
import { SupportedMap } from "../types";
import { LAYER_ID, SOURCE_ID } from "../definitions";

const createMockMap = (): SupportedMap => {
  const sources = new Map<string, any>();
  const layers = new Map<string, any>();
  const images = new Map<string, any>();
  const eventHandlers = new Map<string, Function[]>();

  return {
    hasImage: (name: string) => images.has(name),
    addImage: (name: string, image: any) => {
      images.set(name, image);
    },
    removeImage: (name: string) => images.delete(name),
    getSource: (id: string) => sources.get(id),

    addSource: (id: string, sourceDef: any) => {
      const source = {
        ...sourceDef,
        setData: jest.fn((data) => {
          source.data = data;
        }),
      };

      sources.set(id, source);
    },
    getLayer: (id: string) => layers.get(id),
    addLayer: (layer: any) => {
      layers.set(layer.id, layer);
    },
    isStyleLoaded: () => true,
    once: (event: string, callback: () => void) => callback(),
    on: (event: string, callback: (e: any) => void) => {
      if (!eventHandlers.has(event)) eventHandlers.set(event, []);
      eventHandlers.get(event)!.push(callback);
    },
    off: (event: string, callback: (e: any) => void) => {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) handlers.splice(index, 1);
      }
    },
    queryRenderedFeatures: () => [],
    getBounds: () => ({
      toArray: () => [
        [-180, -90],
        [180, 90],
      ],
    }),
  };
};

describe("useFlowersLayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();

    (globalThis as any).crypto = {
      randomUUID: () => "test-uuid",
    };

    (globalThis as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };

    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      return setTimeout(cb, 16) as any;
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not setup when map is null", () => {
    const { result } = renderHook(() => useFlowersLayer(null));
    expect(result.current).toBeUndefined();
  });

  it("should add source and layer to map", async () => {
    const map = createMockMap();
    renderHook(() => useFlowersLayer(map, { count: 5 }));

    await waitFor(() => {
      expect(map.getSource(SOURCE_ID)).toBeDefined();
    });

    expect(map.getLayer(LAYER_ID)).toBeDefined();
  });

  it("should use custom options", async () => {
    const map = createMockMap();
    renderHook(() =>
      useFlowersLayer(map, {
        sourceId: "custom-source",
        layerId: "custom-layer",
        count: 15,
      })
    );

    await waitFor(() => {
      expect(map.getSource("custom-source")).toBeDefined();
    });

    expect(map.getLayer("custom-layer")).toBeDefined();
  });

  it("should cleanup on unmount", async () => {
    const map = createMockMap();
    const { unmount } = renderHook(() => useFlowersLayer(map));

    await waitFor(() => {
      expect(map.getSource(SOURCE_ID)).toBeDefined();
    });

    unmount();
  });

  it("should load base64 icon", async () => {
    const map = createMockMap();
    const addImageSpy = jest.spyOn(map, "addImage");

    renderHook(() =>
      useFlowersLayer(map, {
        iconData: "data:image/png;base64,test",
      })
    );

    await waitFor(() => {
      expect(addImageSpy).toHaveBeenCalled();
    });
  });

  it("should load external icon via fetch", async () => {
    const map = createMockMap();
    const addImageSpy = jest.spyOn(map, "addImage");

    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob()),
      } as Response)
    );
    globalThis.createImageBitmap = jest.fn(() =>
      Promise.resolve({} as ImageBitmap)
    ) as any;

    renderHook(() =>
      useFlowersLayer(map, {
        iconData: "https://example.com/icon.png",
      })
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://example.com/icon.png"
      );
      expect(addImageSpy).toHaveBeenCalled();
    });
  });

  it("should not reload icon if already exists", async () => {
    const map = createMockMap();
    jest.spyOn(map, "hasImage").mockReturnValue(true);
    const addImageSpy = jest.spyOn(map, "addImage");

    renderHook(() => useFlowersLayer(map));

    await waitFor(() => {
      expect(map.getSource(SOURCE_ID)).toBeDefined();
    });

    expect(addImageSpy).not.toHaveBeenCalled();
  });

  it("should replace flower after animation on hover", async () => {
    const map = createMockMap();
    let mousemoveHandler: any;
    jest.spyOn(map, "on").mockImplementation((event, cb) => {
      if (event === "mousemove") mousemoveHandler = cb;
    });

    renderHook(() => useFlowersLayer(map, { count: 1 }));

    let source: any;
    await waitFor(() => {
      source = map.getSource(SOURCE_ID);
      expect(source).toBeDefined();
    });

    // override queryRenderedFeatures to return the feature inside source.data
    jest.spyOn(map, "queryRenderedFeatures").mockImplementation(() => {
      return source.data.features;
    });

    let callCount = 0;
    const originalSetData = source.setData;
    source.setData = (data: any) => {
      callCount++;
      originalSetData.call(source, data);
    };

    mousemoveHandler({ point: [0, 0] });
    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(30 * 16);
    expect(callCount).toBeGreaterThan(1);
  });
});
