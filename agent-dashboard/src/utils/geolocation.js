export function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => {
        const message = error.code === 1
          ? 'Location access is required. Please allow location permission to continue.'
          : 'Unable to read your location. Please enable GPS and try again.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function watchAgentPosition(onPosition, onError) {
  if (!navigator.geolocation) {
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => onPosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    onError,
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
