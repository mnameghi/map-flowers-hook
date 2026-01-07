export const randomPointInBBox = (bbox: number[]): [number, number] => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [
    minLng + Math.random() * (maxLng - minLng),
    minLat + Math.random() * (maxLat - minLat),
  ];
};

export const debounce = <F extends (...args: any[]) => void>(
  fn: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const randomBetween = (a: number, b: number): number => {
  return a + Math.random() * (b - a);
};

export const isActive = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return true;
  const now = new Date();
  const currentYear = now.getFullYear();
  const start = new Date(`${currentYear}-${startDate}`);
  const end = new Date(`${currentYear}-${endDate}`);
  return now >= start && now <= end;
};
