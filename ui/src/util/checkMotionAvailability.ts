export const checkMotionAvailability = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check if the API exists
    if (!window.DeviceOrientationEvent) {
      resolve(false);
      return;
    }

    if ("requestPermission" in window.DeviceOrientationEvent) {
      // We are iOS 13+
      resolve(true);
      return;
    }

    // Android and others...

    // Set up a timeout since some devices may never fire the event
    const timeout = setTimeout(() => {
      window.removeEventListener("deviceorientation", orientationHandler);
      resolve(false);
    }, 1000);

    // Handler to check if we actually receive orientation data
    const orientationHandler = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
        clearTimeout(timeout);
        window.removeEventListener("deviceorientation", orientationHandler);
        resolve(true);
      }
    };

    // Listen for orientation event
    window.addEventListener("deviceorientation", orientationHandler);
  });
};
