# /ughi_sqlalchemy_mvp/app/models.py
from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="admin")  # 'admin', 'moderator', 'user'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat() + "Z" if self.created_at else None
            ),
            "last_login": (
                self.last_login.isoformat() + "Z" if self.last_login else None
            ),
        }


class Business(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'Hotel', 'Restaurant'
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    # This relationship allows us to easily access all reviews for a business
    reviews = db.relationship(
        "Review", backref="business", lazy=True, cascade="all, delete-orphan"
    )

    def serialize(self, avg_rating=None, review_count=None):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "avg_rating": float(avg_rating) if avg_rating is not None else 0,
            "review_count": review_count if review_count is not None else 0,
        }


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey("business.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # Score from 1 to 5
    comment = db.Column(db.Text, nullable=False)
    author_type = db.Column(db.String(50), nullable=False)  # 'Tourist' or 'Employee'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "rating": self.rating,
            "comment": self.comment,
            "author_type": self.author_type,
            "created_at": self.created_at.isoformat() + "Z",
        }
