export const createTicker = (intervalMs: number, initialTimestamp = Number.MIN_SAFE_INTEGER) => {
  let prevTick = initialTimestamp;
  return (timestamp: number) => {
    if (timestamp - prevTick >= intervalMs) {
      prevTick = timestamp;
      return true;
    } else {
      return false;
    }
  };
};
