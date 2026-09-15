from fastapi import FastAPI

app = FastAPI(title="Unishop API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
