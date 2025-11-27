from fastapi import FastAPI

app = FastAPI(title="Smoke Test")

@app.get("/")
def ok():
    return {"ok": True}
