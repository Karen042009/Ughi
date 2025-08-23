#!/usr/bin/env python3
# /ughi_sqlalchemy_mvp/create_admin_user.py
"""
Script to create the initial admin user for the Ughi admin panel.
Run this script after setting up the database to create your first admin user.
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User


def create_admin_user():
    """Create the initial admin user"""
    app = create_app()

    with app.app_context():
        # Check if admin user already exists
        existing_admin = User.query.filter_by(username="admin").first()
        if existing_admin:
            print("Admin user already exists!")
            print(f"Username: {existing_admin.username}")
            print(f"Email: {existing_admin.email}")
            print(f"Role: {existing_admin.role}")
            return

        # Create admin user
        admin_user = User(username="admin", email="admin@ughi.local", role="admin")
        admin_user.set_password("admin")  # Change this password in production!

        try:
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Admin user created successfully!")
            print("Username: admin")
            print("Password: admin123")
            print("Email: admin@ughi.local")
            print("Role: admin")
            print("\n⚠️  IMPORTANT: Change the default password after first login!")
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            db.session.rollback()


def create_sample_users():
    """Create some sample users for testing"""
    app = create_app()

    with app.app_context():
        # Create moderator user
        moderator = User(
            username="moderator", email="moderator@ughi.local", role="moderator"
        )
        moderator.set_password("mod123")

        # Create regular user
        user = User(username="user", email="user@ughi.local", role="user")
        user.set_password("user123")

        try:
            db.session.add(moderator)
            db.session.add(user)
            db.session.commit()
            print("✅ Sample users created successfully!")
            print("Moderator: moderator / mod123")
            print("User: user / user123")
        except Exception as e:
            print(f"❌ Error creating sample users: {e}")
            db.session.rollback()


if __name__ == "__main__":
    print("🚀 Ughi Admin User Creation Script")
    print("=" * 40)

    # Create admin user
    create_admin_user()

    print("\n" + "=" * 40)

    # Ask if user wants to create sample users
    response = input("\nCreate sample users for testing? (y/n): ").lower().strip()
    if response in ["y", "yes"]:
        create_sample_users()

    print("\n✨ Setup complete! You can now login to the admin panel.")
    print("Visit: /admin/login")
