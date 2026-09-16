export const env = {
	// Falls back to the dev backend so tests/CI work without a real .env
	// (it isn't checked into git — see backend/.env.example for the pattern).
	apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
};
