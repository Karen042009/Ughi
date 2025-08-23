# Ughi (Ուղի) - Հայաստանի անվտանգության ուղեցույց - Complete Guide

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Auto Setup & Installation](#auto-setup--installation)
4. [Database Management](#database-management)
5. [Admin Panel](#admin-panel)
6. [API Endpoints](#api-endpoints)
7. [Technical Details](#technical-details)
8. [Usage Examples](#usage-examples)
9. [Armenian Places](#armenian-places)
10. [Troubleshooting](#troubleshooting)
11. [Future Development](#future-development)

---

## 🎯 Project Overview

Ughi-ն (Ուղի) միայնակ ճանապարհորդների համար նախատեսված վեբ հավելված է, որը օգնում է գտնել Հայաստանում անվտանգ և վստահելի վայրեր: Հավելվածը ներառում է քարտեզ, վայրերի ցուցակ և կարծիքների համակարգ:

### 🌟 What's New in Version 2.0

- **🚀 Auto Setup**: Automatic database initialization and admin user creation
- **📊 Enhanced Admin Panel**: Comprehensive business, review, and user management
- **🔐 User Authentication**: Secure login system with role-based access
- **📈 Statistics Dashboard**: Real-time system statistics and analytics
- **🔄 Bulk Operations**: Manage multiple items simultaneously

---

## ✨ Features

### 🗺️ Core Features

- **Ինտերակտիվ քարտեզ** - Leaflet-ով ստեղծված քարտեզ Հայաստանի վայրերով
- **Վայրերի ցուցակ** - Բոլոր վայրերի ցուցակ՝ գնահատականներով
- **Կարծիքների համակարգ** - Շրջաշրջիկների և աշխատակիցների կարծիքներ
- **Բազմալեզու աջակցություն** - Հայերեն, անգլերեն և ռուսերեն
- **Ԉրոնման ֆունկցիա** - Վայրեր որոնել ըստ անվան կամ տեսակի
- **👨‍💼 Admin պանել** - Վայրեր ավելացնելու և կառավարելու համար

### 🏛️ Business Types

- **Hotel** - Հյուրանոցներ
- **Restaurant** - Ռեստորաններ
- **Attraction** - Տեսարժան վայրեր
- **Museum** - Թանգարաններ
- **Cafe** - Կաֆեներ

---

## 🚀 Auto Setup & Installation

### ✨ What Auto Setup Does

When you activate `run.py`, the system automatically performs:

1. **📊 Database Initialization** - Creates SQLite database
2. **🏗️ Table Creation** - Creates all necessary tables
3. **🏛️ Armenian Places** - Automatically adds all Armenian places
4. **💬 Sample Reviews** - Creates sample reviews in 3 languages
5. **👤 Admin User** - Creates admin account

### 🎯 How to Use

#### Option 1: Auto Setup + Server

```bash
cd ughi_sqlalchemy_mvp
python run.py
```

#### Option 2: Database Only

```bash
cd ughi_sqlalchemy_mvp
python quick_init.py
```

### 🔐 Admin Access After Setup

- **URL**: `http://localhost:5000/admin`
- **Username**: `admin`
- **Password**: `admin`

⚠️ **IMPORTANT**: Change the default password after first login!

### 📋 What Gets Created

#### 🏛️ Armenian Places

- All places from `armenian_places.py` file
- Different types (museum, church, monument, etc.)
- Coordinates and descriptions

#### 💬 Reviews

- **Armenian** - 10 different reviews
- **English** - 10 different reviews
- **Russian** - 10 different reviews
- 2-4 reviews per place
- Ratings 3-5 stars

#### 👥 Users

- **Admin** - `admin` / `admin` (full permissions)
- **Moderator** - `moderator` / `mod123` (moderation permissions)
- **User** - `user` / `user123` (basic user)

### 🔄 Repeated Activation

If you activate `run.py` again:

- ✅ Database already exists
- ✅ Tables already created
- ✅ Armenian places already added
- ✅ Admin user already exists
- 🚀 Server starts

---

## 🗄️ Database Management

### 📊 Database Structure

#### Business Table

- `id` - Unique identifier
- `name` - Place name
- `type` - Place type
- `latitude` - Latitude
- `longitude` - Longitude

#### Review Table

- `id` - Unique identifier
- `business_id` - Place ID
- `rating` - Rating (1-5)
- `comment` - Comment
- `author_type` - Author type (Tourist/Employee)
- `created_at` - Creation date

#### User Table

- `id` - Unique identifier
- `username` - Username
- `email` - Email address
- `role` - User role (admin/moderator/user)
- `password_hash` - Encrypted password

### 🛠️ Manual Database Operations

#### Initialize Database

```bash
python init_db_armenian.py
```

#### Create Admin User

```bash
python create_admin_user.py
```

---

## 👨‍💼 Admin Panel

### 🚀 New Features

#### 1. **Statistics Dashboard**

- **Real-time Statistics**: View total businesses, reviews, users, and average ratings
- **Visual Charts**: Rating distribution and business type charts
- **Recent Activity**: Track activity from the last 7 days

#### 2. **Enhanced Business Management**

- **Edit Functionality**: Modify existing business details
- **Bulk Operations**: Select and delete multiple businesses
- **Search & Filter**: Find businesses quickly
- **Export Data**: Download all data as JSON

#### 3. **Advanced Review Management**

- **Edit Reviews**: Modify rating, comment, and author type
- **Bulk Operations**: Select and delete multiple reviews
- **Contextual Display**: Reviews shown when business is selected

#### 4. **User Management System**

- **User Authentication**: Secure login system
- **Role-based Access**: Admin, Moderator, and User roles
- **User CRUD**: Create, read, update, and delete users
- **Bulk Operations**: Manage multiple users
- **Account Status**: Activate/deactivate accounts

### 🔐 Authentication & Security

#### Login System

- **Secure Login**: Username/password authentication
- **Session Management**: Persistent login sessions
- **Logout**: Secure session termination

#### Access Control

- **Protected Routes**: All admin functions require authentication
- **Role-based Access**: Different permissions for different roles
- **Session Security**: Secure session handling

### 📱 User Interface

#### Responsive Design

- **Mobile Friendly**: Works on all device sizes
- **Modern UI**: Clean, intuitive interface
- **Armenian Language**: Full Armenian language support

#### Interactive Elements

- **Modals**: Clean forms for editing and adding
- **Toast Notifications**: User feedback for actions
- **Real-time Updates**: Statistics and data refresh automatically
- **Smooth Animations**: Professional user experience

---

## 🔌 API Endpoints

### Authentication

- `POST /admin/login` - User login
- `GET /admin/logout` - User logout

### User Management

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/<id>` - Update user
- `DELETE /api/admin/users/<id>` - Delete user
- `POST /api/admin/users/bulk-delete` - Bulk delete users

### Business Management

- `POST /api/admin/businesses` - Create business
- `PUT /api/admin/businesses/<id>` - Update business
- `DELETE /api/admin/businesses/<id>` - Delete business
- `POST /api/admin/businesses/bulk-delete` - Bulk delete businesses
- `POST /api/admin/businesses/reorder` - Reorder businesses

### Review Management

- `PUT /api/admin/reviews/<id>` - Update review
- `DELETE /api/admin/reviews/<id>` - Delete review
- `POST /api/admin/reviews/bulk-delete` - Bulk delete reviews

### Statistics & Export

- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/export` - Export all data

---

## 🛠️ Technical Details

### 🏗️ Architecture

- **Backend**: Flask + SQLAlchemy
- **Database**: SQLite
- **Frontend**: HTML + CSS + JavaScript
- **Maps**: Leaflet.js
- **Icons**: Font Awesome

### 📁 File Structure

- `run.py` - Main server + auto setup
- `quick_init.py` - Quick database initialization
- `init_db_armenian.py` - Manual database initialization
- `create_admin_user.py` - Manual admin user creation
- `config.py` - Configuration settings

### ⚙️ Configuration

- **Database File**: `instance/ughi.db`
- **Database Type**: SQLite
- **Configuration**: `config.py`

---

## 🎯 Usage Examples

### Adding a New Business

#### Via Admin Panel

1. Navigate to "Ավելացնել նոր վայր" section
2. Fill in business name, type, and coordinates
3. Click "Ավելացնել"
4. Business appears in the businesses list

#### Via Code

Edit `armenian_places.py` file:

```python
{
    "name": "Նոր վայրի անունը",
    "type": "Attraction",
    "latitude": 40.1234,
    "longitude": 44.5678,
    "description": "Վայրի նկարագրությունը"
}
```

Then reinitialize database:

```bash
python init_db_armenian.py
```

### Managing Reviews

1. Select a business from the businesses list
2. View existing reviews
3. Add new reviews with ratings and comments
4. Edit or delete existing reviews

### User Management

1. Go to "Օգտատերերի կառավարում" section
2. Click "Ավելացնել օգտատեր" to create new users
3. Use checkboxes to select users for bulk operations
4. Edit user details or delete accounts

### Exporting Data

1. Click "Export" button in the businesses section
2. Data downloads as JSON file
3. File includes all businesses and their reviews

---

## 🏛️ Armenian Places

The application includes major places in Armenia:

- **Երևան** - Capital, Cascade, Opera House
- **Գյումրի** - Second largest city
- **Վանաձոր** - Third largest city
- **Դիլիջան** - Armenia's Switzerland
- **Սևան** - Largest lake
- **Ծաղկաձոր** - Winter resort
- **Գորիս** - Cave settlement
- **Ջերմուկ** - Health resort
- **Գառնի** - Pagan temple
- **Գեղարդ** - Cave monastery
- **Էջմիածին** - Armenian Apostolic Church center
- **Զվարթնոց** - Ancient temple ruins
- **Խոր Վիրապ** - Ancient monastery
- **Նորավանք** - Ancient monastery
- **Տաթև** - Great monastery

---

## 🚨 Troubleshooting

### Common Issues

#### Error 1: "No module named 'app'"

```bash
# Make sure you're in the correct directory
cd ughi_sqlalchemy_mvp
```

#### Error 2: "Permission denied"

```bash
# Database file permissions
chmod 644 instance/ughi.db
```

#### Error 3: "Database is locked"

```bash
# Close all connections and try again
# Or delete database and start over
rm instance/ughi.db
python run.py
```

#### Login Problems

- Check username/password
- Ensure user account is active
- Verify user role and permissions

#### Database Errors

- Verify database connection
- Check file permissions
- Ensure database file exists

### Debug Mode

Enable debug mode in development:

```python
app.run(debug=True)
```

---

## 🔮 Future Development

### Planned Features

- [ ] **Advanced Analytics**: More detailed statistics and reports
- [ ] **Audit Logs**: Track all admin actions
- [ ] **API Rate Limiting**: Prevent abuse
- [ ] **Two-Factor Authentication**: Enhanced security
- [ ] **Backup & Restore**: Data management tools
- [ ] **Multi-language Support**: Additional languages

### Integration Possibilities

- **Email Notifications**: User activity alerts
- **External APIs**: Integration with mapping services
- **Mobile App**: Native mobile admin interface
- **Webhooks**: Real-time data synchronization

### User Accounts

- [ ] User registration and profiles
- [ ] Personal review history
- [ ] Favorite places
- [ ] User-generated content

### Enhanced Features

- [ ] Place photos
- [ ] Safety ratings
- [ ] More places - You can add any place in Armenia

---

## 📞 Support

For technical support or feature requests:

1. Check this complete guide for setup instructions
2. Review error logs for debugging
3. Ensure all dependencies are installed
4. Verify database connectivity
5. Check file permissions

### Dependencies Installation

```bash
# Virtual environment activation
source venv/bin/activate

# Required packages installation
pip install flask flask-sqlalchemy werkzeug
```

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Ughi (Ուղի) - Armenia Safety Guide

---

**🎉 Congratulations! Your Ughi project now automatically sets up everything when you run it!**

**Version**: 2.0.0  
**Last Updated**: 2024  
**Compatibility**: Python 3.7+, Flask 2.0+
