export function filterItineraries(itineraries, { days, area, interests } = {}) {
  return itineraries.filter((itinerary) => {
    if (days && itinerary.days !== days) return false;
    if (area && itinerary.area !== area) return false;
    if (interests && interests.length > 0) {
      const hasMatch = interests.some((interest) => itinerary.interests.includes(interest));
      if (!hasMatch) return false;
    }
    return true;
  });
}
