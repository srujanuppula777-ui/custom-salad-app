from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    office_address = Column(String, nullable=True)
    google_location = Column(String, nullable=True) # Home Location
    office_google_location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_type = Column(String, nullable=False)  # breakfast / lunch / dinner
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    day_type = Column(String, nullable=True, default="weekdays")  # Legacy
    delivery_schedule = Column(Text, nullable=True) # JSON dict of Day -> Location
    pause_dates = Column(Text, nullable=True, default="[]")         # JSON list of ISO date strings
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="subscriptions")
