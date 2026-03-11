from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ─── Customer Schemas ────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    name: str
    phone: str
    address: str
    office_address: Optional[str] = None
    google_location: Optional[str] = None
    office_google_location: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Subscription Schemas ─────────────────────────────────────────────────────

class SubscriptionBase(BaseModel):
    service_type: str          # breakfast / lunch / dinner
    start_date: date
    end_date: date
    day_type: Optional[str] = "weekdays" # weekdays / all_days / weekends
    delivery_schedule: Optional[dict] = None # Mapping of Day -> Location
    pause_dates: Optional[List[str]] = []  # ISO date strings to skip


class SubscriptionCreate(SubscriptionBase):
    customer_id: int


class SubscriptionOut(SubscriptionBase):
    id: int
    customer_id: int
    pause_dates: Optional[List[str]] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Dashboard Schema ─────────────────────────────────────────────────────────

class DashboardMealDetail(BaseModel):
    customer_id: int
    customer_name: str
    phone: str
    location_type: str
    address: str
    google_location: Optional[str]


class DashboardOut(BaseModel):
    breakfast: int
    lunch: int
    dinner: int
    date: str
    breakfast_details: List[DashboardMealDetail] = []
    lunch_details: List[DashboardMealDetail] = []
    dinner_details: List[DashboardMealDetail] = []


class DashboardDayOut(BaseModel):
    date: str          # ISO date string e.g. "2026-03-02"
    weekday: str       # e.g. "Mon", "Tue"
    breakfast: int
    lunch: int
    dinner: int
    total: int
    breakfast_details: List[DashboardMealDetail] = []
    lunch_details: List[DashboardMealDetail] = []
    dinner_details: List[DashboardMealDetail] = []


class DashboardUpcomingOut(BaseModel):
    days: List[DashboardDayOut]
