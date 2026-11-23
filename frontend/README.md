# CareBook: Frontend

React + Vite frontend for Clinic Appointment Booking. See the main README for the full setup.

## Run

1. npm install
2. npm run dev — opens at http://localhost:5173 (start the backend on port 5000 first)
3. npm run lint — checks the code

## Structure

- `src/main.jsx` starts React with the router and the login provider
- `src/App.jsx` lists all pages by role, with route guards
- `src/api/` talks to the backend: `client.js` sends every request, `endpoints.js` has one function per backend route
- `src/context/` and `src/hooks/` hold the logged-in user and shared logic (data loading, pagination)
- `src/components/` has the layout (header, footer, profile menu), route guards, shared UI pieces and icons
- `src/pages/` has the login/register, patient and doctor screens
- `src/styles/` has the design system: `tokens.css` holds the Figma colours, fonts and sizes

## Notes

- Requests to `/api` are forwarded to the backend by the Vite proxy (`vite.config.js`), so the login cookie works.
- All data comes from the backend; nothing is hard-coded.