# **App Name**: Alpine Snow Watch

## Core Features:

- Copernicus Data Ingestion: Fetches NDSI data from Copernicus Data Space Ecosystem for specified coordinates using SentinelHub's Statistical API for the last 90 days.
- Evalscript Processing: Applies the provided Evalscript to process satellite imagery and calculate NDSI values, masking out cloudy pixels.
- Geospatial Data Representation: Defines geographical stations (Valley, Glacier, Summit) with corresponding coordinates and bounding boxes.
- Interactive Folium Map: Displays an interactive Folium map with station markers and circle overlays representing the bounding boxes.
- NDSI Time-Series Chart: Generates a Plotly time-series chart visualizing NDSI trends for each station over the last 90 days.
- KPI Cards: Displays three KPI cards showing the latest cloud-free NDSI reading for each station.
- Credential Management and Security: Fetches SentinelHub API credentials securely using Streamlit's secrets management.

## Style Guidelines:

- Primary color: Soft blue (#7EC4CF) to evoke the crisp, cold atmosphere of alpine environments, contrasting well with the dark background.
- Background color: Dark gray (#2E3440) for a clean, modern dark mode interface.
- Accent color: Light orange (#D08770) to highlight interactive elements and key data points.
- Font: 'PT Sans' (humanist sans-serif) for clear, readable text throughout the application.
- Two-column layout: Interactive Folium map on the left and Plotly chart/KPI cards on the right for a balanced presentation.
- Simple, outlined icons for station markers on the map to provide a clean and informative visual representation.
- Subtle transitions when updating the chart or map, providing smooth user feedback.