# /ughi_sqlalchemy_mvp/app/routes.py
from flask import (
    Blueprint,
    render_template,
    jsonify,
    request,
    session,
    redirect,
    url_for,
)
from app import db
from app.models import Business, Review, User
from sqlalchemy import func, text
import sqlalchemy as sa
from datetime import datetime, timedelta
from functools import wraps

main = Blueprint("main", __name__)


# Simple session-based authentication (for MVP)
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("main.admin_login"))
        return f(*args, **kwargs)

    return decorated_function


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/admin")
@admin_required
def admin_page():
    return render_template("admin.html")


@main.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        data = request.get_json() or {}
        username = data.get("username")
        password = data.get("password")

        user = User.query.filter_by(username=username, is_active=True).first()
        if user and user.check_password(password):
            session["user_id"] = user.id
            session["username"] = user.username
            session["role"] = user.role

            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()

            return jsonify({"success": True, "redirect": url_for("main.admin_page")})
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    return render_template("admin_login.html")


@main.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("main.admin_login"))


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
@main.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_get_users():
    users = User.query.all()
    return jsonify([user.serialize() for user in users])


@main.route("/api/admin/users", methods=["POST"])
@admin_required
def admin_create_user():
    data = request.get_json() or {}
    required = ["username", "email", "password", "role"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing data"}), 400

    # Check if username or email already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(username=data["username"], email=data["email"], role=data["role"])
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "user": user.serialize()}), 201


@main.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
def admin_update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if "username" in data and data["username"] != user.username:
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "Username already exists"}), 400
        user.username = data["username"]

    if "email" in data and data["email"] != user.email:
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already exists"}), 400
        user.email = data["email"]

    if "role" in data:
        user.role = data["role"]

    if "is_active" in data:
        user.is_active = data["is_active"]

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify({"success": True, "user": user.serialize()})


@main.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)

    # Prevent self-deletion
    if user.id == session.get("user_id"):
        return jsonify({"error": "Cannot delete yourself"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/admin/users/bulk-delete", methods=["POST"])
@admin_required
def admin_bulk_delete_users():
    data = request.get_json() or {}
    user_ids = data.get("user_ids", [])

    if not user_ids:
        return jsonify({"error": "No user IDs provided"}), 400

    try:
        user_ids = [int(x) for x in user_ids]
    except Exception:
        return jsonify({"error": "Invalid user IDs"}), 400

    # Prevent self-deletion
    if session.get("user_id") in user_ids:
        return jsonify({"error": "Cannot delete yourself"}), 400

    users = User.query.filter(User.id.in_(user_ids)).all()
    for user in users:
        db.session.delete(user)

    db.session.commit()
    return jsonify({"success": True, "deleted_count": len(users)})


@main.route("/api/admin/businesses", methods=["POST"])
@admin_required
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


@main.route("/api/admin/businesses/<int:business_id>", methods=["PUT"])
@admin_required
def admin_edit_business(business_id: int):
    biz = Business.query.get_or_404(business_id)
    data = request.get_json() or {}

    if "name" in data:
        biz.name = data["name"]
    if "type" in data:
        biz.type = data["type"]
    if "latitude" in data:
        biz.latitude = float(data["latitude"])
    if "longitude" in data:
        biz.longitude = float(data["longitude"])

    db.session.commit()
    return jsonify({"success": True, "business": biz.serialize()})


@main.route("/api/admin/businesses/<int:business_id>", methods=["DELETE"])
@admin_required
def admin_delete_business(business_id: int):
    biz = Business.query.get_or_404(business_id)
    db.session.delete(biz)
    ensure_order_table()
    db.session.execute(
        text("DELETE FROM business_order WHERE business_id = :id"), {"id": business_id}
    )
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/admin/businesses/bulk-delete", methods=["POST"])
@admin_required
def admin_bulk_delete_businesses():
    data = request.get_json() or {}
    business_ids = data.get("business_ids", [])

    if not business_ids:
        return jsonify({"error": "No business IDs provided"}), 400

    try:
        business_ids = [int(x) for x in business_ids]
    except Exception:
        return jsonify({"error": "Invalid business IDs"}), 400

    # Delete businesses and their reviews
    businesses = Business.query.filter(Business.id.in_(business_ids)).all()
    for biz in businesses:
        db.session.delete(biz)

    # Clean up order table
    ensure_order_table()
    for bid in business_ids:
        db.session.execute(
            text("DELETE FROM business_order WHERE business_id = :id"), {"id": bid}
        )

    db.session.commit()
    return jsonify({"success": True, "deleted_count": len(businesses)})


@main.route("/api/admin/reviews/<int:review_id>", methods=["PUT"])
@admin_required
def admin_edit_review(review_id: int):
    rev = Review.query.get_or_404(review_id)
    data = request.get_json() or {}

    if "rating" in data:
        rev.rating = int(data["rating"])
    if "comment" in data:
        rev.comment = data["comment"]
    if "author_type" in data:
        rev.author_type = data["author_type"]

    db.session.commit()
    return jsonify({"success": True, "review": rev.serialize()})


@main.route("/api/admin/reviews/<int:review_id>", methods=["DELETE"])
@admin_required
def admin_delete_review(review_id: int):
    rev = Review.query.get_or_404(review_id)
    db.session.delete(rev)
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/admin/reviews/bulk-delete", methods=["POST"])
@admin_required
def admin_bulk_delete_reviews():
    data = request.get_json() or {}
    review_ids = data.get("review_ids", [])

    if not review_ids:
        return jsonify({"error": "No review IDs provided"}), 400

    try:
        review_ids = [int(x) for x in review_ids]
    except Exception:
        return jsonify({"error": "Invalid review IDs"}), 400

    reviews = Review.query.filter(Review.id.in_(review_ids)).all()
    for rev in reviews:
        db.session.delete(rev)

    db.session.commit()
    return jsonify({"success": True, "deleted_count": len(reviews)})


@main.route("/api/admin/statistics", methods=["GET"])
@admin_required
def admin_statistics():
    # Get basic counts
    total_businesses = Business.query.count()
    total_reviews = Review.query.count()
    total_users = User.query.count()

    # Get business types count
    business_types = (
        db.session.query(Business.type, func.count(Business.id).label("count"))
        .group_by(Business.type)
        .all()
    )

    # Get rating distribution
    rating_distribution = (
        db.session.query(Review.rating, func.count(Review.id).label("count"))
        .group_by(Review.rating)
        .order_by(Review.rating.desc())
        .all()
    )

    # Get recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_reviews = Review.query.filter(Review.created_at >= week_ago).count()
    recent_businesses = Business.query.filter(
        Business.id >= 1
    ).count()  # All businesses for now

    # Get average rating
    avg_rating = db.session.query(func.avg(Review.rating)).scalar() or 0

    return jsonify(
        {
            "total_businesses": total_businesses,
            "total_reviews": total_reviews,
            "total_users": total_users,
            "business_types": [
                {"type": t.type, "count": t.count} for t in business_types
            ],
            "rating_distribution": [
                {"rating": r.rating, "count": r.count} for r in rating_distribution
            ],
            "recent_reviews": recent_reviews,
            "recent_businesses": recent_businesses,
            "average_rating": round(float(avg_rating), 2) if avg_rating else 0,
        }
    )


@main.route("/api/admin/export", methods=["GET"])
@admin_required
def admin_export_data():
    # Export businesses
    businesses = Business.query.all()
    businesses_data = []
    for biz in businesses:
        biz_data = biz.serialize()
        # Get reviews for this business
        reviews = Review.query.filter_by(business_id=biz.id).all()
        biz_data["reviews"] = [r.serialize() for r in reviews]
        businesses_data.append(biz_data)

    return jsonify(
        {
            "export_date": datetime.utcnow().isoformat() + "Z",
            "businesses": businesses_data,
        }
    )


@main.route("/api/admin/businesses/reorder", methods=["POST"])
@admin_required
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
