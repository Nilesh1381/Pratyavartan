# CORS Security Fix - Fix empty ALLOWED_ORIGINS allowing all origins

# Before (in main.py lines 77-88):
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# After - fix the empty list fallback:
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",")
    if origin.strip()
]
# Only default to "*" if ALLOWED_ORIGINS is not set at all (None), not if it's empty
if os.getenv("ALLOWED_ORIGINS") is None:
    _allowed_origins = ["http://localhost:8000,http://127.0.0.1:8000"]  # fallback as comma string
else:
    _allowed_origins = _allowed_origins or ["localhost", "127.0.0.1"]  # local dev defaults
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)