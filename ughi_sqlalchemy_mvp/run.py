# /ughi_sqlalchemy_mvp/run.py
from app import create_app, db
from app.models import Business, Review, User
from armenian_places import ARMENIAN_PLACES
from sqlalchemy import text
import os
import random


def initialize_database():
    """Ավտոմատ սկզբնավորում տվյալների բազայի"""
    print("🚀 Սկսվում է տվյալների բազայի ավտոմատ սկզբնավորում...")

    # Ստուգում ենք արդյոք տվյալների բազան արդեն գոյություն ունի
    db_path = os.path.join(os.path.dirname(__file__), "instance", "ughi.db")
    if os.path.exists(db_path):
        print("✅ Տվյալների բազան արդեն գոյություն ունի")
        return

    print("📊 Ստեղծվում են աղյուսակներ...")
    db.create_all()

    # Ստեղծում ենք հայկական վայրեր
    print("🏛️ Ստեղծվում են հայկական վայրեր...")
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
    db.session.commit()
    print(f"✅ Ավելացվեց {len(businesses)} հայկական վայր")

    # Ստեղծում ենք կարծիքներ
    print("💬 Ստեղծվում են կարծիքներ...")

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

    all_reviews = []
    for business in businesses:
        num_reviews = random.randint(2, 4)
        for _ in range(num_reviews):
            lang = random.choice(["hy", "en", "ru"])
            if lang == "hy":
                comment = random.choice(armenian_comments)
            elif lang == "en":
                comment = random.choice(english_comments)
            else:
                comment = random.choice(russian_comments)

            review = Review(
                business_id=business.id,
                rating=random.randint(3, 5),
                comment=comment,
                author_type=random.choice(["Tourist", "Employee"]),
            )
            all_reviews.append(review)

    db.session.add_all(all_reviews)
    db.session.commit()
    print(f"✅ Ավելացվեց {len(all_reviews)} կարծիք")

    # Ստեղծում ենք վայրերի կարգավորման աղյուսակ
    print("📋 Ստեղծվում է վայրերի կարգավորման աղյուսակ...")

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

    for i, business in enumerate(businesses):
        db.session.execute(
            text(
                "INSERT OR REPLACE INTO business_order (business_id, position) VALUES (:id, :pos)"
            ),
            {"id": business.id, "pos": i},
        )

    db.session.commit()
    print("✅ Վայրերի կարգավորման աղյուսակը ստեղծվեց")

    print("\n🎉 Տվյալների բազան հաջողությամբ սկզբնավորվեց!")
    print(f"📊 Ընդհանուր վայրեր: {len(businesses)}")
    print(f"💬 Ընդհանուր կարծիքներ: {len(all_reviews)}")


def create_admin_user():
    """Ավտոմատ ստեղծում ադմին օգտատիրոջ"""
    print("👤 Ստուգվում է ադմին օգտատերը...")

    existing_admin = User.query.filter_by(username="admin").first()
    if existing_admin:
        print("✅ Ադմին օգտատերը արդեն գոյություն ունի")
        return

    print("🔐 Ստեղծվում է ադմին օգտատերը...")
    admin_user = User(username="admin", email="admin@ughi.local", role="admin")
    admin_user.set_password("admin")

    try:
        db.session.add(admin_user)
        db.session.commit()
        print("✅ Ադմին օգտատերը հաջողությամբ ստեղծվեց!")
        print("👤 Username: admin")
        print("🔑 Password: admin")
        print("⚠️  ԿԱՐԵՎՈՐ: Փոխեք գաղտնաբառը առաջին մուտքից հետո!")
    except Exception as e:
        print(f"❌ Սխալ ադմին օգտատիրոջ ստեղծման ժամանակ: {e}")
        db.session.rollback()


def auto_setup():
    """Ավտոմատ կարգավորում"""
    try:
        with app.app_context():
            initialize_database()
            create_admin_user()

            print("\n" + "=" * 50)
            print("🎯 Ավտոմատ կարգավորումը ավարտված է!")
            print(
                "🌐 Դուք կարող եք գնալ /admin էջ՝ վայրեր ավելացնելու կամ խմբագրելու համար:"
            )
            print("🔗 http://localhost:5000/admin")
            print("👤 Ադմին մուտք: admin / admin")
            print("=" * 50)

    except Exception as e:
        print(f"❌ Սխալ ավտոմատ կարգավորման ժամանակ: {e}")


app = create_app()

if __name__ == "__main__":
    # Ավտոմատ կարգավորում մինչև սերվերի մեկնարկը
    auto_setup()

    # Մեկնարկում ենք սերվերը
    print("🚀 Սերվերը մեկնարկվում է...")
    app.run(debug=True)
