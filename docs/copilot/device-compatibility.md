# SmartView-ai Device Compatibility & Fallbacks

SmartView Pro™ implements automatic device capability detection:
- **High-Spec Devices:** Full ADAS HUD telemetry, 3D Gaussian Splatting / photogrammetry reconstruction, high-fps camera capture, and real-time vector RAG queries.
- **Mid/Lower-Spec Devices:** Graceful fallback to 2D survey overlays, compressed image capture, simplified estimation calculations, and lightweight retrieval index.
- **Sensor Fallbacks:** Simulated compass/orientation or GPS when physical hardware sensors are restricted or unavailable.
