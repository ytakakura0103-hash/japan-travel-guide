export function filterActivities(activities, { city, interests } = {}) {
  return activities.filter((activity) => {
    if (city && activity.city !== city) return false;
    if (interests && interests.length > 0) {
      const hasMatch = interests.some((interest) => activity.interests.includes(interest));
      if (!hasMatch) return false;
    }
    return true;
  });
}
