# /ughi_sqlalchemy_mvp/init_db.py
from app import create_app, db
from app.models import Business, Review
import os
import random

# Create an app instance to work with
app = create_app()

# Use the application context
with app.app_context():
    # Drop all existing tables (for a clean start) and create new ones
    db.drop_all()
    db.create_all()

    # --- Create Sample Data ---
    print("Creating sample data...")

    # Core Businesses
    b1 = Business(
        name="Tufenkian Historic Yerevan Hotel",
        type="Hotel",
        latitude=40.1751,
        longitude=44.5102,
    )
    b2 = Business(
        name="Karas National Food Chain",
        type="Restaurant",
        latitude=40.1772,
        longitude=44.5035,
    )
    b3 = Business(
        name="Vanadzor Technology Center",
        type="Attraction",
        latitude=40.8031,
        longitude=44.4851,
    )
    b4 = Business(
        name="Dilijan Loft", type="Hotel", latitude=40.7410, longitude=44.8631
    )

    # Additional Businesses
    b5 = Business(
        name="Yerevan Opera Theatre",
        type="Attraction",
        latitude=40.1872,
        longitude=44.5155,
    )
    b6 = Business(
        name="Megerian Carpet Museum",
        type="Attraction",
        latitude=40.1520,
        longitude=44.4866,
    )
    b7 = Business(
        name="Gyumri Old Brewery",
        type="Restaurant",
        latitude=40.7895,
        longitude=43.8453,
    )
    b8 = Business(
        name="Sevan Lake Resort", type="Hotel", latitude=40.5572, longitude=45.0037
    )
    b9 = Business(
        name="Tsaghkadzor Ropeway",
        type="Attraction",
        latitude=40.5309,
        longitude=44.7202,
    )
    b10 = Business(
        name="Goris Old Cave Village",
        type="Attraction",
        latitude=39.5105,
        longitude=46.3656,
    )
    b11 = Business(
        name="Cascade Complex", type="Attraction", latitude=40.1916, longitude=44.5152
    )
    b12 = Business(
        name="Armenia Wine Factory",
        type="Attraction",
        latitude=40.1599,
        longitude=44.3465,
    )

    db.session.add_all([b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12])
    db.session.commit()  # assign IDs

    # Reviews (hy/en/ru mixed) for initial set
    seed_reviews = [
        Review(
            business_id=b1.id,
            rating=4,
            comment="Գերազանց տեղադրվածություն, ապահով է։ Քիչ աղմկոտ շաբաթավերջերին։",
            author_type="Tourist",
        ),
        Review(
            business_id=b4.id,
            rating=5,
            comment="Amazing place for solo travelers! Staff is super respectful.",
            author_type="Tourist",
        ),
        Review(
            business_id=b4.id,
            rating=5,
            comment="Как сотрудник, подтверждаю строгие правила безопасности.",
            author_type="Employee",
        ),
        Review(
            business_id=b2.id,
            rating=3,
            comment="Food is good, but the area is very crowded at night.",
            author_type="Tourist",
        ),
        Review(
            business_id=b3.id,
            rating=5,
            comment="Современно, безопасно и вдохновляюще!",
            author_type="Tourist",
        ),
        Review(
            business_id=b5.id,
            rating=5,
            comment="Գեղեցիկ տարածք, երեկոյան աշխույժ, բայց անվտանգ։",
            author_type="Tourist",
        ),
        Review(
            business_id=b6.id,
            rating=4,
            comment="Welcoming staff and very interesting exhibits.",
            author_type="Tourist",
        ),
        Review(
            business_id=b7.id,
            rating=3,
            comment="Весёлая атмосфера, следите за вещами в часы пик.",
            author_type="Tourist",
        ),
        Review(
            business_id=b8.id,
            rating=4,
            comment="Calm by the lake, well-lit paths at night.",
            author_type="Tourist",
        ),
        Review(
            business_id=b9.id,
            rating=5,
            comment="Կազմակերպված և ապահով, անձնակազմը շատ օգնող է։",
            author_type="Tourist",
        ),
        Review(
            business_id=b10.id,
            rating=4,
            comment="Remote and peaceful; best to go with a guide at dusk.",
            author_type="Tourist",
        ),
        Review(
            business_id=b11.id,
            rating=5,
            comment="Great views, lively but felt safe.",
            author_type="Tourist",
        ),
        Review(
            business_id=b12.id,
            rating=4,
            comment="Вкусно, чисто, хорошая организация туров.",
            author_type="Tourist",
        ),
    ]

    db.session.add_all(seed_reviews)
    db.session.commit()

    # ---- Generate 100 additional businesses strictly within Armenia (inner bbox) ----
    random.seed(42)
    # Inner bounding box fully within Armenia to avoid borders
    LAT_MIN, LAT_MAX = 39.0, 41.2
    LON_MIN, LON_MAX = 44.0, 46.0
    types = ["Hotel", "Restaurant", "Attraction", "Cafe", "Museum"]
    armenian_comments = [
        "Ապահով և հարմար տեղ։",
        "Լավ սպասարկում, խորհուրդ եմ տալիս։",
        "Գիշերը լույսավոր է, խնդիրներ չունեցանք։",
        "Քիչ աղմուկ, ընտանիքի համար հարմար։",
    ]
    english_comments = [
        "Felt safe, staff were friendly.",
        "Busy at night, but overall okay.",
        "Clean and well-organized.",
        "Great for solo travelers.",
    ]
    russian_comments = [
        "Безопасно и уютно.",
        "Персонал вежливый, место понравилось.",
        "Немного шумно вечером.",
        "Хорошее освещение и чисто.",
    ]

    generated_businesses = []
    for i in range(100):
        lat = random.uniform(LAT_MIN, LAT_MAX)
        lng = random.uniform(LON_MIN, LON_MAX)
        b = Business(
            name=f"Armenia Spot #{i+1}",
            type=random.choice(types),
            latitude=lat,
            longitude=lng,
        )
        generated_businesses.append(b)

    db.session.add_all(generated_businesses)
    db.session.commit()

    # Build reviews for generated businesses (2-4 each, multilingual)
    generated_reviews = []
    for b in generated_businesses:
        for _ in range(random.randint(2, 4)):
            lang = random.choice(["hy", "en", "ru"])
            if lang == "hy":
                comment = random.choice(armenian_comments)
            elif lang == "en":
                comment = random.choice(english_comments)
            else:
                comment = random.choice(russian_comments)
            r = Review(
                business_id=b.id,
                rating=random.randint(2, 5),
                comment=comment,
                author_type=random.choice(["Tourist", "Employee"]),
            )
            generated_reviews.append(r)

    db.session.add_all(generated_reviews)
    db.session.commit()

    print("Database has been initialized and seeded with sample data!")
