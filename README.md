# Weather App

A weather forecasting web application with admin panel and analytics.

## How to Run

1. **Start any local server** (any of these will work):

   - `python -m http.server 8000`
   - Or use VS Code Live Server extension
   - Or any other local web server

2. **Open in browser:**
   - Main page: http://localhost:8000/index.html
   - Admin panel: http://localhost:8000/admin.html

## Admin Panel

- **Password:** `2` (1+1=2)
- **Features:**
  - View daily page analytics
  - Add new weather forecasts
  - Delete existing forecasts
  - Changes save automatically to browser storage

## Files

- `index.html` - Main weather forecast page
- `admin.html` - Admin dashboard
- `other.html` - Live weather page
- `data.json` - Initial weather predictions data
- `analytics.js` - Page view tracking
- `admin.js` - Admin functionality
- `script.js` - Main page functionality
- `style.css` - Styling

## Important Notes

- Forecasts are stored in browser localStorage
- Changes made in admin panel appear immediately on index.html (just refresh)
- Page views are tracked in browser localStorage
- Analytics reset daily automatically
- Initial data is loaded from data.json, then stored in localStorage
