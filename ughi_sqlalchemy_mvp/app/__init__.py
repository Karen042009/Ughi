# /ughi_sqlalchemy_mvp/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
import os

# Initialize the database extension
db = SQLAlchemy()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions with the app
    db.init_app(app)

    # Import and register blueprints
    from app.routes import main

    app.register_blueprint(main)

    return app
