import crypto from "crypto";

/**
 * Normalize text for signature generation
 * Removes extra whitespace, punctuation, and converts to lowercase
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

export function createBugSignature(item, url = "") {
  // Normalize the URL to prevent "http://localhost" vs "http://localhost/" issues
  const cleanUrl = (url || "").split('?')[0].replace(/\/$/, "");

  // Normalize the title to catch similar issues
  // "Failed to Fetch" vs "Fetch Error" vs "Network Failure" should be similar
  const normalizedTitle = normalizeText(item.title || item.message || "");

  // Extract key words from title (minimum 3 characters)
  const keywords = normalizedTitle
    .split(" ")
    .filter(word => word.length >= 3)
    .sort() // Sort to make order-independent
    .join(" ");

  const base = [
    item.type || "UNKNOWN",
    keywords, // Use normalized keywords instead of raw message
    cleanUrl
  ].join("|");

  return crypto.createHash("sha1").update(base).digest("hex");
}