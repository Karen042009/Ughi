# /ughi_sqlalchemy_mvp/app/routes.py
from flask import Blueprint, render_template, jsonify, request
from app import db
from app.models import Business, Review
from sqlalchemy import func

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/businesses", methods=["GET"])
def get_businesses():
    results = (
        db.session.query(
            Business,
            func.avg(Review.rating).label("average_rating"),
            func.count(Review.id).label("review_count"),
        )
        .outerjoin(Review, Business.id == Review.business_id)
        .group_by(Business.id)
        .all()
    )

    businesses_with_stats = []
    for business, avg_rating, review_count in results:
        business_data = business.serialize(
            avg_rating=avg_rating, review_count=review_count
        )
        businesses_with_stats.append(business_data)

    return jsonify(businesses_with_stats)


@main.route("/api/reviews/<int:business_id>", methods=["GET"])
def get_reviews(business_id):
    reviews = (
        Review.query.filter_by(business_id=business_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify([r.serialize() for r in reviews])


@main.route("/api/reviews", methods=["POST"])
def add_review():
    data = request.get_json()

    if not data or not all(
        k in data for k in ["business_id", "rating", "comment", "author_type"]
    ):
        return jsonify({"error": "Missing data"}), 400

    new_review = Review(
        business_id=data["business_id"],
        rating=data["rating"],
        comment=data["comment"],
        author_type=data["author_type"],
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify({"success": True, "review": new_review.serialize()}), 201
