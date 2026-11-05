/** Prefer a browser language pack so recording works without its remote speech service. */
export async function prepareSpeechRecognition(Recognition, recognition, lang) {
  if (!Recognition || !("processLocally" in recognition) ||
      typeof Recognition.available !== "function") {
    return "remote";
  }

  try {
    const options = { langs: [lang], processLocally: true };
    const availability = await Recognition.available(options);
    if (availability === "available") {
      recognition.processLocally = true;
      return "local";
    }
    if ((availability === "downloadable" || availability === "downloading") &&
        typeof Recognition.install === "function") {
      const installed = await Recognition.install(options);
      if (installed) {
        recognition.processLocally = true;
        return "local";
      }
    }
  } catch {
    // Older browsers and restrictive permissions policies can reject this check.
  }
  recognition.processLocally = false;
  return "remote";
}
