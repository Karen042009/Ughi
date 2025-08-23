#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# /ughi_sqlalchemy_mvp/delete_place.py
# Վայր ջնջելու սկրիպտ

from app import create_app, db
from app.models import Business, Review


def show_places():
    """Ցույց տալ բոլոր վայրերը"""

    app = create_app()

    with app.app_context():
        places = Business.query.all()

        print(f"\n📍 Ընդհանուր վայրեր: {len(places)}")
        print("=" * 60)

        for i, place in enumerate(places, 1):
            # Հաշվել կարծիքները
            review_count = Review.query.filter_by(business_id=place.id).count()
            print(
                f"{i:2d}. ID: {place.id:2d} | {place.name:<40} | {place.type:<12} | Կարծիքներ: {review_count}"
            )

        return places


def delete_place(place_id):
    """Ջնջել վայրը ID-ով"""

    app = create_app()

    with app.app_context():
        place = Business.query.get(place_id)
        if not place:
            print(f"❌ Վայր ID {place_id} չի գտնվել")
            return False

        # Հաշվել կարծիքները
        review_count = Review.query.filter_by(business_id=place_id).count()

        print(f"\n=== Վայրի տվյալները ===")
        print(f"ID: {place.id}")
        print(f"Անուն: {place.name}")
        print(f"Տեսակ: {place.type}")
        print(f"Կոորդինատներ: {place.latitude}, {place.longitude}")
        print(f"Կարծիքներ: {review_count}")

        confirm = (
            input(f"\nՋնջե՞լ այս վայրը և նրա բոլոր կարծիքները (y/n): ").strip().lower()
        )
        if confirm != "y":
            print("❌ Չեղարկվեց")
            return False

        try:
            # Ջնջել կարծիքները
            if review_count > 0:
                Review.query.filter_by(business_id=place_id).delete()
                print(f"✅ Ջնջվեցին {review_count} կարծիքներ")

            # Ջնջել վայրը
            db.session.delete(place)
            db.session.commit()

            print(f"✅ Վայրը հաջողությամբ ջնջվեց")
            return True

        except Exception as e:
            print(f"❌ Սխալ ջնջման ժամանակ: {e}")
            db.session.rollback()
            return False


def main():
    """Հիմնական ֆունկցիա"""
    print("Ughi (Ուղի) - Վայր ջնջելու գործիք")
    print("=" * 50)

    while True:
        # Ցույց տալ վայրերը
        places = show_places()

        if not places:
            print("❌ Տվյալների բազայում վայրեր չկան")
            break

        print("\n" + "=" * 60)
        choice = input(
            "Ընտրեք վայրի համարը ջնջելու համար (կամ 'q' ելքի համար): "
        ).strip()

        if choice.lower() == "q":
            break

        try:
            place_index = int(choice) - 1
            if 0 <= place_index < len(places):
                place = places[place_index]
                delete_place(place.id)
            else:
                print("❌ Անվավեր համար")
        except ValueError:
            print("❌ Խնդրում ենք մուտքագրել թիվ")

        print("\n" + "=" * 50)
        continue_choice = input("Շարունակե՞լ (y/n): ").strip().lower()
        if continue_choice != "y":
            break

    print("\n👋 Շնորհակալություն օգտագործման համար!")


if __name__ == "__main__":
    main()
