# /ughi_sqlalchemy_mvp/config.py
import os

# Get the absolute path of the directory the script is in
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "a-very-secret-key-you-should-change"
    # Define the path for the SQLite database file
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(
        BASE_DIR, "instance", "ughi.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
