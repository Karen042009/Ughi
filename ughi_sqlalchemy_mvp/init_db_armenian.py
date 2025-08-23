# /ughi_sqlalchemy_mvp/init_db_armenian.py
# Հայաստանի իսկական վայրերով տվյալների բազայի սկզբնավորում

from app import create_app, db
from app.models import Business, Review
from armenian_places import ARMENIAN_PLACES
from sqlalchemy import text
import os
import random

# Create an app instance to work with
app = create_app()

# Use the application context
with app.app_context():
    # Drop all existing tables (for a clean start) and create new ones
    db.drop_all()
    db.create_all()

    # --- Create Armenian Places Data ---
    print("Ստեղծվում են հայկական վայրեր...")

    # Add all Armenian places to the database
    businesses = []
    for place in ARMENIAN_PLACES:
        business = Business(
            name=place["name"],
            type=place["type"],
            latitude=place["latitude"],
            longitude=place["longitude"],
        )
        businesses.append(business)

    db.session.add_all(businesses)
    db.session.commit()  # assign IDs
    print(f"Ավելացվեց {len(businesses)} հայկական վայր")

    # --- Create Sample Reviews ---
    print("Ստեղծվում են կարծիքներ...")

    # Armenian comments
    armenian_comments = [
        "Գերազանց տեղադրվածություն, ապահով է։ Քիչ աղմկոտ շաբաթավերջերին։",
        "Լավ սպասարկում, խորհուրդ եմ տալիս։",
        "Գիշերը լույսավոր է, խնդիրներ չունեցանք։",
        "Քիչ աղմուկ, ընտանիքի համար հարմար։",
        "Շատ գեղեցիկ վայր, անվտանգ է։",
        "Լավ կազմակերպված, անձնակազմը շատ օգնող է։",
        "Հարմար տեղադրվածություն, հեշտ է գտնել։",
        "Գիշերը լույսավոր է, խնդիրներ չունեցանք։",
        "Քիչ աղմուկ, ընտանիքի համար հարմար։",
        "Շատ գեղեցիկ վայր, անվտանգ է։",
    ]

    # English comments
    english_comments = [
        "Felt safe, staff were friendly.",
        "Busy at night, but overall okay.",
        "Clean and well-organized.",
        "Great for solo travelers.",
        "Beautiful location, very safe.",
        "Well-lit at night, no issues.",
        "Quiet area, good for families.",
        "Staff was very helpful.",
        "Easy to find, good location.",
        "Great atmosphere, felt secure.",
    ]

    # Russian comments
    russian_comments = [
        "Безопасно и уютно.",
        "Персонал вежливый, место понравилось.",
        "Немного шумно вечером.",
        "Хорошее освещение и чисто.",
        "Красивое место, безопасно.",
        "Хорошо организовано, персонал помогал.",
        "Удобное расположение, легко найти.",
        "Ночью освещено, проблем не было.",
        "Тихая зона, подходит для семей.",
        "Отличная атмосфера, чувствовал себя в безопасности.",
    ]

    # Create reviews for each business
    all_reviews = []
    for business in businesses:
        # Add 2-4 reviews per business
        num_reviews = random.randint(2, 4)
        for _ in range(num_reviews):
            # Randomly choose language
            lang = random.choice(["hy", "en", "ru"])
            if lang == "hy":
                comment = random.choice(armenian_comments)
            elif lang == "en":
                comment = random.choice(english_comments)
            else:
                comment = random.choice(russian_comments)

            review = Review(
                business_id=business.id,
                rating=random.randint(3, 5),  # Mostly positive ratings
                comment=comment,
                author_type=random.choice(["Tourist", "Employee"]),
            )
            all_reviews.append(review)

    db.session.add_all(all_reviews)
    db.session.commit()
    print(f"Ավելացվեց {len(all_reviews)} կարծիք")

    # --- Create business order table ---
    print("Ստեղծվում է վայրերի կարգավորման աղյուսակ...")

    # Create business_order table
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

    # Insert business order (by ID for now)
    for i, business in enumerate(businesses):
        db.session.execute(
            text(
                "INSERT OR REPLACE INTO business_order (business_id, position) VALUES (:id, :pos)"
            ),
            {"id": business.id, "pos": i},
        )

    db.session.commit()
    print("Վայրերի կարգավորման աղյուսակը ստեղծվեց")

    print("\n=== Տվյալների բազան հաջողությամբ սկզբնավորվեց ===")
    print(f"Ընդհանուր վայրեր: {len(businesses)}")
    print(f"Ընդհանուր կարծիքներ: {len(all_reviews)}")

    # Show some statistics
    print("\nՎայրերի տեսակներով:")
    type_counts = {}
    for business in businesses:
        if business.type not in type_counts:
            type_counts[business.type] = 0
        type_counts[business.type] += 1

    for place_type, count in type_counts.items():
        print(f"  {place_type}: {count} վայր")

    print("\nՏվյալների բազան պատրաստ է օգտագործման համար!")
    print("Դուք կարող եք գնալ /admin էջ՝ վայրեր ավելացնելու կամ խմբագրելու համար:")
    print("http://localhost:5000/admin")
