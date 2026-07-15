export function filterSpots(spots, { area, tag } = {}) {
  return spots.filter((spot) => {
    if (area && spot.area !== area) return false;
    if (tag && !spot.tags.includes(tag)) return false;
    return true;
  });
}
