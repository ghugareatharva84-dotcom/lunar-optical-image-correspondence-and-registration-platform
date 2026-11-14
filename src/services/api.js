import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Executes image registration on the backend using the specified feature matching algorithm.
 */
export async function registerImages(source, reference, options = {}) {
  const {
    algorithm = "LOFTR_MAGSAC",
    source_sensor = "OHRC",
    reference_sensor = "OHRC",
    apply_clahe = true,
  } = options;

  const formData = new FormData();
  formData.append("source", source);
  formData.append("reference", reference);
  formData.append("algorithm", algorithm);
  formData.append("source_sensor", source_sensor);
  formData.append("reference_sensor", reference_sensor);
  formData.append("apply_clahe", apply_clahe);

  const response = await axios.post(`${API_BASE_URL}/register`, formData, {
    timeout: 180000,
  });

  return response.data;
}

/**
 * Fetch registration history from backend (Supabase / local archive).
 */
export async function getHistory() {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
}

/**
 * Fetch full registration record by ID to open/inspect past result.
 */
export async function getHistoryDetail(recordId) {
  const response = await axios.get(`${API_BASE_URL}/history/${recordId}`);
  return response.data;
}

/**
 * Delete all registration history from mission archive.
 */
export async function deleteHistory() {
  const response = await axios.delete(`${API_BASE_URL}/history`);
  return response.data;
}

/**
 * Delete a specific registration record by ID.
 */
export async function deleteHistoryRecord(recordId) {
  const response = await axios.delete(`${API_BASE_URL}/history/${recordId}`);
  return response.data;
}

/**
 * Fetch available sample lunar image pairs for 1-click evaluation.
 */
export async function getSamples() {
  const response = await axios.get(`${API_BASE_URL}/samples`);
  return response.data;
}

/**
 * Download sample image blob to populate source or reference inputs.
 */
export async function fetchSampleBlob(path) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await axios.get(url, { responseType: "blob" });
  return response.data;
}

/**
 * Health and sensor diagnostics check.
 */
export async function checkHealth() {
  const response = await axios.get(`${API_BASE_URL}/health`);
  return response.data;
}

/**
 * Formats relative or absolute result image URL.
 */
export function resultUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}
