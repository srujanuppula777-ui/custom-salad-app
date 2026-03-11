from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import json
from database import get_db
import models, schemas

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def generate_service_dates(start: date, end: date, day_type: str, delivery_schedule: dict = None) -> List[date]:
    """Generate list of valid service dates based on schedule or day_type."""
    dates = []
    current = start
    WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    while current <= end:
        weekday_idx = current.weekday()  # 0=Mon, 6=Sun
        weekday_name = WEEKDAYS[weekday_idx]
        
        if delivery_schedule is not None:
            if weekday_name in delivery_schedule:
                dates.append(current)
        else:
            if day_type == "weekdays" and weekday_idx < 5:
                dates.append(current)
            elif day_type == "weekends" and weekday_idx >= 5:
                dates.append(current)
            elif day_type == "all_days":
                dates.append(current)
        current += timedelta(days=1)
    return dates


def extend_end_date(end: date, pause_count: int, day_type: str, delivery_schedule: dict = None) -> date:
    """Extend end_date by pause_count valid service days."""
    if pause_count == 0:
        return end
    current = end
    added = 0
    WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    while added < pause_count:
        current += timedelta(days=1)
        weekday_idx = current.weekday()
        weekday_name = WEEKDAYS[weekday_idx]
        
        if delivery_schedule is not None:
            if weekday_name in delivery_schedule:
                added += 1
        else:
            if day_type == "weekdays" and weekday_idx < 5:
                added += 1
            elif day_type == "weekends" and weekday_idx >= 5:
                added += 1
            elif day_type == "all_days":
                added += 1
    return current


@router.get("/customer/{customer_id}", response_model=List[schemas.SubscriptionOut])
def get_customer_subscriptions(customer_id: int, db: Session = Depends(get_db)):
    subs = (
        db.query(models.Subscription)
        .filter(models.Subscription.customer_id == customer_id)
        .order_by(models.Subscription.start_date.desc())
        .all()
    )
    # Parse JSON for each sub
    for s in subs:
        try:
            s.pause_dates = json.loads(s.pause_dates or "[]")
        except Exception:
            s.pause_dates = []
            
        try:
            s.delivery_schedule = json.loads(s.delivery_schedule) if s.delivery_schedule else None
        except Exception:
            s.delivery_schedule = None
    return subs


@router.post("/", response_model=schemas.SubscriptionOut, status_code=201)
def create_subscription(sub: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == sub.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if sub.start_date > sub.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    pause_list = sub.pause_dates or []
    schedule = sub.delivery_schedule
    # Extend end_date by number of paused days (valid days based on day_type)
    adjusted_end = extend_end_date(sub.end_date, len(pause_list), sub.day_type, schedule)

    db_sub = models.Subscription(
        customer_id=sub.customer_id,
        service_type=sub.service_type,
        start_date=sub.start_date,
        end_date=adjusted_end,
        day_type=sub.day_type,
        delivery_schedule=json.dumps(schedule) if schedule else None,
        pause_dates=json.dumps(pause_list),
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    db_sub.pause_dates = pause_list
    db_sub.delivery_schedule = schedule
    return db_sub


@router.delete("/{subscription_id}", status_code=204)
def delete_subscription(subscription_id: int, db: Session = Depends(get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()


@router.get("/dates/{subscription_id}")
def get_subscription_dates(subscription_id: int, db: Session = Depends(get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    paused = set(json.loads(sub.pause_dates or "[]"))
    try:
        schedule = json.loads(sub.delivery_schedule) if sub.delivery_schedule else None
    except Exception:
        schedule = None
    dates = generate_service_dates(sub.start_date, sub.end_date, sub.day_type, schedule)
    active = [d for d in dates if d.isoformat() not in paused]
    return {
        "dates": [d.isoformat() for d in active],
        "paused_dates": list(paused),
        "total_days": len(active),
    }
