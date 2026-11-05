import test from "node:test";
import assert from "node:assert/strict";
import { prepareSpeechRecognition } from "./speechRecognition.js";

test("uses an installed Vietnamese pack without the remote service", async () => {
  const recognition = { processLocally: false };
  const Recognition = { available: async () => "available" };
  assert.equal(await prepareSpeechRecognition(Recognition, recognition, "vi-VN"), "local");
  assert.equal(recognition.processLocally, true);
});

test("installs a downloadable pack and uses local recognition", async () => {
  const recognition = { processLocally: false };
  const Recognition = {
    available: async () => "downloadable",
    install: async ({ langs }) => langs[0] === "vi-VN",
  };
  assert.equal(await prepareSpeechRecognition(Recognition, recognition, "vi-VN"), "local");
  assert.equal(recognition.processLocally, true);
});

test("falls back to the remote API when local recognition is unavailable", async () => {
  const recognition = { processLocally: true };
  const Recognition = { available: async () => "unavailable" };
  assert.equal(await prepareSpeechRecognition(Recognition, recognition, "vi-VN"), "remote");
  assert.equal(recognition.processLocally, false);
});
