from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
import json
from database import get_db
import models, schemas

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def is_active_on(sub: models.Subscription, day: date) -> bool:
    """Check if a subscription is active for a given day (respecting pauses)."""
    if not (sub.start_date <= day <= sub.end_date):
        return False
    weekday_idx = day.weekday()  # 0=Mon, 6=Sun
    WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekday_name = WEEKDAYS[weekday_idx]

    try:
        schedule = json.loads(sub.delivery_schedule) if sub.delivery_schedule else None
    except Exception:
        schedule = None

    if schedule is not None:
        if weekday_name not in schedule:
            return False
    else:
        if sub.day_type == "weekdays" and weekday_idx >= 5:
            return False
        if sub.day_type == "weekends" and weekday_idx < 5:
            return False
    # Check paused dates
    try:
        paused = set(json.loads(sub.pause_dates or "[]"))
    except Exception:
        paused = set()
    if day.isoformat() in paused:
        return False
    return True


@router.get("/today", response_model=schemas.DashboardOut)
def get_today_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    subscriptions = db.query(models.Subscription).all()

    counts = {"breakfast": 0, "lunch": 0, "dinner": 0}
    details = {"breakfast": [], "lunch": [], "dinner": []}

    for sub in subscriptions:
        if is_active_on(sub, today):
            stype = sub.service_type.lower()
            if stype in counts:
                counts[stype] += 1
                
                # Resolve address details dynamically
                weekday_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][today.weekday()]
                loc_type = "Home"
                if sub.delivery_schedule:
                    try:
                        sched = json.loads(sub.delivery_schedule)
                        loc_type = sched.get(weekday_name, "Home")
                    except Exception:
                        pass
                
                addr = sub.customer.address
                g_loc = sub.customer.google_location
                if loc_type == "Office":
                    addr = sub.customer.office_address or addr
                    g_loc = sub.customer.office_google_location or g_loc
                
                details[stype].append(schemas.DashboardMealDetail(
                    customer_id=sub.customer.id,
                    customer_name=sub.customer.name,
                    phone=sub.customer.phone,
                    location_type=loc_type,
                    address=addr,
                    google_location=g_loc
                ))

    return schemas.DashboardOut(
        breakfast=counts["breakfast"],
        lunch=counts["lunch"],
        dinner=counts["dinner"],
        date=today.isoformat(),
        breakfast_details=details["breakfast"],
        lunch_details=details["lunch"],
        dinner_details=details["dinner"]
    )


@router.get("/upcoming", response_model=schemas.DashboardUpcomingOut)
def get_upcoming_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    subscriptions = db.query(models.Subscription).all()

    WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    WEEKDAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    days = []
    for offset in range(6):
        day = today + timedelta(days=offset)
        counts = {"breakfast": 0, "lunch": 0, "dinner": 0}
        details = {"breakfast": [], "lunch": [], "dinner": []}
        
        weekday_name = WEEKDAYS_FULL[day.weekday()]

        for sub in subscriptions:
            if is_active_on(sub, day):
                stype = sub.service_type.lower()
                if stype in counts:
                    counts[stype] += 1

                    loc_type = "Home"
                    if sub.delivery_schedule:
                        try:
                            sched = json.loads(sub.delivery_schedule)
                            loc_type = sched.get(weekday_name, "Home")
                        except Exception:
                            pass
                    
                    addr = sub.customer.address
                    g_loc = sub.customer.google_location
                    if loc_type == "Office":
                        addr = sub.customer.office_address or addr
                        g_loc = sub.customer.office_google_location or g_loc

                    details[stype].append(schemas.DashboardMealDetail(
                        customer_id=sub.customer.id,
                        customer_name=sub.customer.name,
                        phone=sub.customer.phone,
                        location_type=loc_type,
                        address=addr,
                        google_location=g_loc
                    ))

        days.append(schemas.DashboardDayOut(
            date=day.isoformat(),
            weekday=WEEKDAY_SHORT[day.weekday()],
            breakfast=counts["breakfast"],
            lunch=counts["lunch"],
            dinner=counts["dinner"],
            total=counts["breakfast"] + counts["lunch"] + counts["dinner"],
            breakfast_details=details["breakfast"],
            lunch_details=details["lunch"],
            dinner_details=details["dinner"]
        ))

    return schemas.DashboardUpcomingOut(days=days)
