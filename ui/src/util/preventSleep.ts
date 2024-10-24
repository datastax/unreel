export async function preventSleep() {
  if ("wakeLock" in navigator) {
    try {
      document.addEventListener(
        "click",
        async () => {
          const wakeLock = await navigator.wakeLock.request("screen");
          return wakeLock;
        },
        { once: true }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message);
    }
  }
}
