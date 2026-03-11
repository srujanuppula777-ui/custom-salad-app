from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import customers, subscriptions, dashboard

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Custom Salad API",
    description="Meal Subscription & Customer Management System",
    version="1.0.0",
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(subscriptions.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Custom Salad API is running 🥗"}
