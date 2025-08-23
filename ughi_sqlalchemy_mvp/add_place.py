#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# /ughi_sqlalchemy_mvp/add_place.py
# Նոր վայր ավելացնելու սկրիպտ

from app import create_app, db
from app.models import Business
import sys


def add_place():
    """Նոր վայր ավելացնել տվյալների բազայում"""

    print("=== Նոր վայր ավելացնել ===")
    print("Հայաստանի վայրերի տվյալների բազայում")
    print()

    # Ստանալ տվյալները օգտագործողից
    try:
        name = input("Վայրի անունը (հայերեն): ").strip()
        if not name:
            print("❌ Անունը չի կարող դատարկ լինել")
            return False

        print("\nՎայրի տեսակները:")
        print("1. Hotel - Հյուրանոց")
        print("2. Restaurant - Ռեստորան")
        print("3. Attraction - Տեսարժան վայր")
        print("4. Museum - Թանգարան")
        print("5. Cafe - Կաֆե")

        type_choice = input("\nԸնտրեք տեսակը (1-5): ").strip()

        type_mapping = {
            "1": "Hotel",
            "2": "Restaurant",
            "3": "Attraction",
            "4": "Museum",
            "5": "Cafe",
        }

        if type_choice not in type_mapping:
            print("❌ Անվավեր ընտրություն")
            return False

        place_type = type_mapping[type_choice]

        try:
            latitude = float(input("Լատիտուդ (օրինակ՝ 40.1792): ").strip())
        except ValueError:
            print("❌ Անվավեր լատիտուդ")
            return False

        try:
            longitude = float(input("Լոնգիտուդ (օրինակ՝ 44.4991): ").strip())
        except ValueError:
            print("❌ Անվավեր լոնգիտուդ")
            return False

        description = input("Նկարագրություն (ըստ ցանկության): ").strip()

    except KeyboardInterrupt:
        print("\n❌ Չեղարկվեց օգտագործողի կողմից")
        return False

    # Ստուգել կոորդինատները
    if not (38.8 <= latitude <= 41.3 and 43.4 <= longitude <= 46.6):
        print("⚠️  Ուշադրություն: Կոորդինատները գտնվում են Հայաստանի սահմաններից դուրս")
        confirm = input("Շարունակե՞լ (y/n): ").strip().lower()
        if confirm != "y":
            print("❌ Չեղարկվեց")
            return False

    # Հաստատել տվյալները
    print("\n=== Վայրի տվյալները ===")
    print(f"Անուն: {name}")
    print(f"Տեսակ: {place_type}")
    print(f"Լատիտուդ: {latitude}")
    print(f"Լոնգիտուդ: {longitude}")
    if description:
        print(f"Նկարագրություն: {description}")

    confirm = input("\nՀաստատե՞լ (y/n): ").strip().lower()
    if confirm != "y":
        print("❌ Չեղարկվեց")
        return False

    # Ավելացնել տվյալների բազայում
    try:
        app = create_app()
        with app.app_context():
            new_business = Business(
                name=name, type=place_type, latitude=latitude, longitude=longitude
            )

            db.session.add(new_business)
            db.session.commit()

            print(f"\n✅ Հաջողությամբ ավելացվեց!")
            print(f"ID: {new_business.id}")
            print(f"Անուն: {new_business.name}")
            print(f"Տեսակ: {new_business.type}")
            print(f"Կոորդինատներ: {new_business.latitude}, {new_business.longitude}")

            return True

    except Exception as e:
        print(f"❌ Սխալ տվյալների բազայում: {e}")
        return False


def main():
    """Հիմնական ֆունկցիա"""
    print("Ughi (Ուղի) - Նոր վայր ավելացնել")
    print("=" * 40)

    while True:
        success = add_place()

        if success:
            print("\n" + "=" * 40)
            another = input("Ավելացնե՞լ մեկ այլ վայր (y/n): ").strip().lower()
            if another != "y":
                break
        else:
            print("\n" + "=" * 40)
            retry = input("Փորձե՞լ նորից (y/n): ").strip().lower()
            if retry != "y":
                break

        print()

    print("\n👋 Շնորհակալություն օգտագործման համար!")
    print("Հավելվածը կարող եք բացել՝ python run.py")


if __name__ == "__main__":
    main()
