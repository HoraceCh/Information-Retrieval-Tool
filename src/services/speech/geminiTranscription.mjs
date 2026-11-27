function createAbortError() {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError();
}

export function readAudioBlobAsBase64(audioBlob, signal, FileReaderConstructor = globalThis.FileReader) {
  throwIfAborted(signal);
  if (typeof FileReaderConstructor !== "function") {
    return Promise.reject(new Error("FileReader is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReaderConstructor();
    let settled = false;

    const cleanup = () => signal?.removeEventListener("abort", onSignalAbort);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const onSignalAbort = () => {
      if (settled) return;
      if (reader.readyState === 1) {
        try { reader.abort(); } catch { /* settle as cancelled below */ }
      }
      finish(reject, createAbortError());
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const separator = result.indexOf(",");
      if (separator < 0) {
        finish(reject, new Error("Could not encode recorded audio."));
        return;
      }
      finish(resolve, result.slice(separator + 1));
    };
    reader.onerror = () => finish(reject, reader.error || new Error("Could not read recorded audio."));
    reader.onabort = () => finish(reject, createAbortError());

    if (signal) {
      signal.addEventListener("abort", onSignalAbort, { once: true });
      if (signal.aborted) {
        onSignalAbort();
        return;
      }
    }

    try {
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      finish(reject, error);
    }
  });
}

/**
 * Browser-side Gemini transcription with cancellation during both file encoding
 * and the SDK request. SDK cancellation stops client-side waiting/network work;
 * it cannot guarantee that remote inference or billing is stopped.
 */
export async function transcribeGeminiAudio(audioBlob, { signal, generateContent, FileReaderConstructor } = {}) {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
    throw new Error("No audio data was recorded. Please record again.");
  }
  if (typeof generateContent !== "function") {
    throw new TypeError("A Gemini generateContent function is required.");
  }

  const base64Data = await readAudioBlobAsBase64(audioBlob, signal, FileReaderConstructor);
  throwIfAborted(signal);

  const rawMime = audioBlob.type || "audio/webm";
  let mimeType = rawMime.split(";")[0].trim();
  if (!mimeType.startsWith("audio/")) mimeType = "audio/webm";

  const response = await generateContent({
    model: "gemini-3.5-transcribe",
    contents: [
      { inlineData: { mimeType, data: base64Data } },
      "Transcribe this spoken audio into text accurately. Output only the verbatim transcribed speech text without commentary, conversational preamble, quotation marks, or markdown code blocks."
    ],
    config: { abortSignal: signal }
  });

  throwIfAborted(signal);
  return typeof response?.text === "string" ? response.text.trim() : "";
}
