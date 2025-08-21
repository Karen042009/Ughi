# /ughi_sqlalchemy_mvp/app/routes.py
from flask import Blueprint, render_template, jsonify, request
from app import db
from app.models import Business, Review
from sqlalchemy import func, text
import sqlalchemy as sa

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/admin")
def admin_page():
    return render_template("admin.html")


def ensure_order_table():
    db.session.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS business_order (
                business_id INTEGER PRIMARY KEY,
                position INTEGER NOT NULL
            )
            """
        )
    )
    db.session.commit()


@main.route("/api/businesses", methods=["GET"])
def get_businesses():
    ensure_order_table()
    # Reflect business_order table to join safely
    bo = sa.Table("business_order", db.metadata, autoload_with=db.engine)
    co_pos = func.coalesce(bo.c.position, Business.id).label("pos")

    results = (
        db.session.query(
            Business,
            func.avg(Review.rating).label("average_rating"),
            func.count(Review.id).label("review_count"),
            co_pos,
        )
        .outerjoin(Review, Review.business_id == Business.id)
        .outerjoin(bo, bo.c.business_id == Business.id)
        .group_by(Business.id, bo.c.position)
        .order_by(co_pos.asc())
        .all()
    )

    businesses_with_stats = []
    for business, avg_rating, review_count, _ in results:
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


# ---- Admin APIs (no auth for MVP; protect in production) ----
@main.route("/api/admin/businesses", methods=["POST"])
def admin_add_business():
    data = request.get_json() or {}
    required = ["name", "type", "latitude", "longitude"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing data"}), 400
    biz = Business(
        name=data["name"],
        type=data["type"],
        latitude=float(data["latitude"]),
        longitude=float(data["longitude"]),
    )
    db.session.add(biz)
    db.session.commit()
    ensure_order_table()
    db.session.execute(
        text(
            "INSERT OR REPLACE INTO business_order (business_id, position) VALUES (:id, :pos)"
        ),
        {"id": biz.id, "pos": biz.id},
    )
    db.session.commit()
    return jsonify({"success": True, "business": biz.serialize()}), 201


@main.route("/api/admin/businesses/<int:business_id>", methods=["DELETE"])
def admin_delete_business(business_id: int):
    biz = Business.query.get_or_404(business_id)
    db.session.delete(biz)
    ensure_order_table()
    db.session.execute(
        text("DELETE FROM business_order WHERE business_id = :id"), {"id": business_id}
    )
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/admin/reviews/<int:review_id>", methods=["DELETE"])
def admin_delete_review(review_id: int):
    rev = Review.query.get_or_404(review_id)
    db.session.delete(rev)
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/admin/businesses/reorder", methods=["POST"])
def admin_reorder_businesses():
    ensure_order_table()
    data = request.get_json() or {}
    order = data.get("order", [])
    try:
        order = [int(x) for x in order]
    except Exception:
        return jsonify({"error": "Invalid order payload"}), 400
    db.session.execute(text("DELETE FROM business_order"))
    for idx, bid in enumerate(order):
        db.session.execute(
            text(
                "INSERT OR REPLACE INTO business_order (business_id, position) VALUES (:id, :pos)"
            ),
            {"id": bid, "pos": idx},
        )
    db.session.commit()
    return jsonify({"success": True})
