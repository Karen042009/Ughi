#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# /ughi_sqlalchemy_mvp/stats.py
# Վայրերի վիճակագրություն ցույց տալու սկրիպտ

from app import create_app, db
from app.models import Business, Review
from sqlalchemy import func
import json


def show_statistics():
    """Ցույց տալ վայրերի վիճակագրությունը"""

    app = create_app()

    with app.app_context():
        print("Ughi (Ուղի) - Վայրերի վիճակագրություն")
        print("=" * 50)

        # Ընդհանուր վիճակագրություն
        total_businesses = Business.query.count()
        total_reviews = Review.query.count()

        print(f"📊 Ընդհանուր վիճակագրություն:")
        print(f"  Վայրեր: {total_businesses}")
        print(f"  Կարծիքներ: {total_reviews}")
        print(f"  Միջին կարծիքներ վայրի համար: {total_reviews/total_businesses:.1f}")

        # Վայրերի տեսակներով
        print(f"\n🏢 Վայրերի տեսակներով:")
        type_stats = (
            db.session.query(Business.type, func.count(Business.id).label("count"))
            .group_by(Business.type)
            .all()
        )

        for place_type, count in type_stats:
            print(f"  {place_type}: {count} վայր")

        # Գնահատականների վիճակագրություն
        print(f"\n⭐ Գնահատականների վիճակագրություն:")
        rating_stats = (
            db.session.query(Review.rating, func.count(Review.id).label("count"))
            .group_by(Review.rating)
            .order_by(Review.rating)
            .all()
        )

        for rating, count in rating_stats:
            stars = "★" * rating + "☆" * (5 - rating)
            print(f"  {stars} ({rating}): {count} կարծիք")

        # Միջին գնահատականներ վայրերի համար
        print(f"\n📈 Միջին գնահատականներ վայրերի համար:")
        avg_ratings = (
            db.session.query(
                Business.name,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .join(Review, Review.business_id == Business.id)
            .group_by(Business.id, Business.name)
            .having(func.count(Review.id) >= 2)
            .order_by(func.avg(Review.rating).desc())
            .limit(10)
            .all()
        )

        for name, avg_rating, review_count in avg_ratings:
            stars = "★" * round(avg_rating) + "☆" * (5 - round(avg_rating))
            print(f"  {name:<40} {stars} ({avg_rating:.1f}) - {review_count} կարծիք")

        # Առավել ակտիվ վայրեր
        print(f"\n🔥 Առավել ակտիվ վայրեր (ամենաշատ կարծիքներով):")
        most_reviewed = (
            db.session.query(Business.name, func.count(Review.id).label("review_count"))
            .join(Review, Review.business_id == Business.id)
            .group_by(Business.id, Business.name)
            .order_by(func.count(Review.id).desc())
            .limit(10)
            .all()
        )

        for name, review_count in most_reviewed:
            print(f"  {name:<40} {review_count} կարծիք")

        # Կարծիքների հեղինակների տեսակներով
        print(f"\n👥 Կարծիքների հեղինակների տեսակներով:")
        author_stats = (
            db.session.query(Review.author_type, func.count(Review.id).label("count"))
            .group_by(Review.author_type)
            .all()
        )

        for author_type, count in author_stats:
            percentage = (count / total_reviews) * 100
            print(f"  {author_type}: {count} կարծիք ({percentage:.1f}%)")

        # Հայաստանի շրջաններով
        print(f"\n🗺️ Հայաստանի շրջաններով:")

        # Երևան (մոտավոր կոորդինատներ)
        yerevan_places = Business.query.filter(
            Business.latitude.between(40.1, 40.2),
            Business.longitude.between(44.4, 44.6),
        ).count()
        print(f"  Երևան: {yerevan_places} վայր")

        # Գյումրի
        gyumri_places = Business.query.filter(
            Business.latitude.between(40.7, 40.8),
            Business.longitude.between(43.8, 43.9),
        ).count()
        print(f"  Գյումրի: {gyumri_places} վայր")

        # Վանաձոր
        vanadzor_places = Business.query.filter(
            Business.latitude.between(40.8, 40.9),
            Business.longitude.between(44.4, 44.5),
        ).count()
        print(f"  Վանաձոր: {vanadzor_places} վայր")

        # Դիլիջան
        dilijan_places = Business.query.filter(
            Business.latitude.between(40.7, 40.8),
            Business.longitude.between(44.8, 44.9),
        ).count()
        print(f"  Դիլիջան: {dilijan_places} վայր")

        # Սևան
        sevan_places = Business.query.filter(
            Business.latitude.between(40.5, 40.6),
            Business.longitude.between(45.0, 45.1),
        ).count()
        print(f"  Սևան: {sevan_places} վայր")

        # Այլ շրջաններ
        other_places = total_businesses - (
            yerevan_places
            + gyumri_places
            + vanadzor_places
            + dilijan_places
            + sevan_places
        )
        print(f"  Այլ շրջաններ: {other_places} վայր")


def export_data():
    """Արտահանել տվյալները JSON ֆորմատով"""

    app = create_app()

    with app.app_context():
        # Ստանալ բոլոր վայրերը կարծիքներով
        businesses = Business.query.all()

        export_data = []
        for business in businesses:
            reviews = Review.query.filter_by(business_id=business.id).all()

            business_data = {
                "id": business.id,
                "name": business.name,
                "type": business.type,
                "latitude": business.latitude,
                "longitude": business.longitude,
                "reviews": [
                    {
                        "rating": review.rating,
                        "comment": review.comment,
                        "author_type": review.author_type,
                        "created_at": review.created_at.isoformat(),
                    }
                    for review in reviews
                ],
            }
            export_data.append(business_data)

        # Պահպանել JSON ֆայլում
        with open("ughi_data_export.json", "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Տվյալները արտահանվեցին ughi_data_export.json ֆայլում")
        print(f"   Ընդհանուր վայրեր: {len(export_data)}")
        print(f"   Ընդհանուր կարծիքներ: {sum(len(b['reviews']) for b in export_data)}")


def main():
    """Հիմնական ֆունկցիա"""
    while True:
        print("\n" + "=" * 50)
        print("Ընտրեք գործողությունը:")
        print("1. Ցույց տալ վիճակագրությունը")
        print("2. Արտահանել տվյալները JSON ֆորմատով")
        print("3. Ելք")

        choice = input("\nՁեր ընտրությունը (1-3): ").strip()

        if choice == "1":
            show_statistics()
        elif choice == "2":
            export_data()
        elif choice == "3":
            break
        else:
            print("❌ Անվավեր ընտրություն")

    print("\n👋 Շնորհակալություն օգտագործման համար!")


if __name__ == "__main__":
    main()
