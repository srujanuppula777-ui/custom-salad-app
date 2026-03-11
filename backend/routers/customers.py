from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import json
from database import get_db
import models, schemas

router = APIRouter(prefix="/customers", tags=["customers"])


def _is_active_today(sub: models.Subscription, today: date) -> bool:
    if not (sub.start_date <= today <= sub.end_date):
        return False
    wd = today.weekday()
    if sub.day_type == "weekdays" and wd >= 5:
        return False
    if sub.day_type == "weekends" and wd < 5:
        return False
    try:
        paused = set(json.loads(sub.pause_dates or "[]"))
    except Exception:
        paused = set()
    return today.isoformat() not in paused


@router.get("/today-status")
def get_today_status(db: Session = Depends(get_db)):
    """Return today's active meal subscriptions keyed by customer_id."""
    today = date.today()
    subs = db.query(models.Subscription).all()
    status: dict = {}
    for sub in subs:
        if _is_active_today(sub, today):
            cid = sub.customer_id
            if cid not in status:
                status[cid] = {"breakfast": False, "lunch": False, "dinner": False}
            stype = sub.service_type.lower()
            if stype in status[cid]:
                status[cid][stype] = True
    return status


@router.get("/", response_model=List[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()


@router.post("/", response_model=schemas.CustomerOut, status_code=201)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in customer.model_dump().items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_customer)
    db.commit()
