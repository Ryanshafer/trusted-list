declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void): void;
  export function expect<T = unknown>(value: T): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toContain(expected: unknown): void;
  };
  export const vi: {
    setSystemTime(value: string | number | Date): void;
    useRealTimers(): void;
  };
}
