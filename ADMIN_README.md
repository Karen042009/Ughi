# Ughi Admin Panel - Enhanced Features

## Overview

The Ughi admin panel has been significantly enhanced with comprehensive functionality for managing businesses, reviews, users, and system statistics. This document outlines all the new features and how to use them.

## 🚀 New Features

### 1. **Statistics Dashboard**

- **Real-time Statistics**: View total businesses, reviews, users, and average ratings
- **Visual Charts**: Rating distribution and business type charts
- **Recent Activity**: Track activity from the last 7 days

### 2. **Enhanced Business Management**

- **Edit Functionality**: Modify existing business details (name, type, coordinates)
- **Bulk Operations**: Select and delete multiple businesses at once
- **Search & Filter**: Find businesses quickly with real-time search
- **Export Data**: Download all business and review data as JSON

### 3. **Advanced Review Management**

- **Edit Reviews**: Modify rating, comment, and author type
- **Bulk Operations**: Select and delete multiple reviews
- **Contextual Display**: Reviews are shown when a business is selected

### 4. **User Management System**

- **User Authentication**: Secure login system with session management
- **Role-based Access**: Admin, Moderator, and User roles
- **User CRUD**: Create, read, update, and delete users
- **Bulk Operations**: Manage multiple users simultaneously
- **Account Status**: Activate/deactivate user accounts

### 5. **Security Features**

- **Session Management**: Secure user sessions
- **Authentication Required**: All admin routes are protected
- **Role-based Permissions**: Different access levels for different user types

## 🔧 Installation & Setup

### 1. **Install Dependencies**

```bash
pip install flask flask-sqlalchemy werkzeug
```

### 2. **Database Setup**

```bash
# Initialize the database
python init_db_armenian.py

# Create admin users
python create_admin_user.py
```

### 3. **Run the Application**

```bash
python run.py
```

## 👤 Default Users

After running the setup script, you'll have these default users:

| Username    | Password   | Role      | Purpose              |
| ----------- | ---------- | --------- | -------------------- |
| `admin`     | `admin123` | Admin     | Full system access   |
| `moderator` | `mod123`   | Moderator | Limited admin access |
| `user`      | `user123`  | User      | Basic access         |

**⚠️ Important**: Change default passwords after first login!

## 📊 Admin Panel Features

### **Statistics Dashboard**

- **Total Counts**: Businesses, reviews, and users
- **Rating Distribution**: Visual representation of review ratings
- **Business Types**: Breakdown by business category
- **Recent Activity**: Last 7 days of activity

### **Business Management**

- **Add New Business**: Name, type, latitude, longitude
- **Edit Business**: Modify existing business information
- **Delete Business**: Remove businesses and associated reviews
- **Bulk Delete**: Select multiple businesses for deletion
- **Search**: Find businesses by name or type
- **Export**: Download all data as JSON

### **Review Management**

- **View Reviews**: See all reviews for selected businesses
- **Add Reviews**: Create new reviews with ratings and comments
- **Edit Reviews**: Modify existing review content
- **Delete Reviews**: Remove individual reviews
- **Bulk Delete**: Select multiple reviews for deletion

### **User Management**

- **Create Users**: Add new users with roles
- **Edit Users**: Modify user information and roles
- **Delete Users**: Remove user accounts
- **Role Management**: Assign admin, moderator, or user roles
- **Account Status**: Activate or deactivate accounts
- **Bulk Operations**: Manage multiple users

## 🔐 Authentication & Security

### **Login System**

- **Secure Login**: Username/password authentication
- **Session Management**: Persistent login sessions
- **Logout**: Secure session termination

### **Access Control**

- **Protected Routes**: All admin functions require authentication
- **Role-based Access**: Different permissions for different roles
- **Session Security**: Secure session handling

## 📱 User Interface

### **Responsive Design**

- **Mobile Friendly**: Works on all device sizes
- **Modern UI**: Clean, intuitive interface
- **Armenian Language**: Full Armenian language support

### **Interactive Elements**

- **Modals**: Clean forms for editing and adding
- **Toast Notifications**: User feedback for actions
- **Real-time Updates**: Statistics and data refresh automatically
- **Smooth Animations**: Professional user experience

## 🛠️ API Endpoints

### **Authentication**

- `POST /admin/login` - User login
- `GET /admin/logout` - User logout

### **User Management**

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/<id>` - Update user
- `DELETE /api/admin/users/<id>` - Delete user
- `POST /api/admin/users/bulk-delete` - Bulk delete users

### **Business Management**

- `POST /api/admin/businesses` - Create business
- `PUT /api/admin/businesses/<id>` - Update business
- `DELETE /api/admin/businesses/<id>` - Delete business
- `POST /api/admin/businesses/bulk-delete` - Bulk delete businesses
- `POST /api/admin/businesses/reorder` - Reorder businesses

### **Review Management**

- `PUT /api/admin/reviews/<id>` - Update review
- `DELETE /api/admin/reviews/<id>` - Delete review
- `POST /api/admin/reviews/bulk-delete` - Bulk delete reviews

### **Statistics & Export**

- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/export` - Export all data

## 🎯 Usage Examples

### **Adding a New Business**

1. Navigate to "Ավելացնել նոր վայր" section
2. Fill in business name, type, and coordinates
3. Click "Ավելացնել"
4. Business appears in the businesses list

### **Managing Reviews**

1. Select a business from the businesses list
2. View existing reviews
3. Add new reviews with ratings and comments
4. Edit or delete existing reviews

### **User Management**

1. Go to "Օգտատերերի կառավարում" section
2. Click "Ավելացնել օգտատեր" to create new users
3. Use checkboxes to select users for bulk operations
4. Edit user details or delete accounts

### **Exporting Data**

1. Click "Export" button in the businesses section
2. Data downloads as JSON file
3. File includes all businesses and their reviews

## 🔧 Configuration

### **Environment Variables**

- `SECRET_KEY`: Flask session secret (auto-generated if not set)
- `DATABASE_URL`: Database connection string

### **Database Models**

- **User**: Authentication and user management
- **Business**: Business information and locations
- **Review**: User reviews and ratings

## 🚨 Security Considerations

### **Production Deployment**

- Change default passwords immediately
- Use strong, unique passwords
- Enable HTTPS in production
- Regular security updates
- Monitor access logs

### **User Roles**

- **Admin**: Full system access
- **Moderator**: Limited administrative functions
- **User**: Basic access only

## 🐛 Troubleshooting

### **Common Issues**

1. **Login Problems**: Check username/password, ensure user is active
2. **Database Errors**: Verify database connection and permissions
3. **Session Issues**: Clear browser cookies, check secret key
4. **Permission Errors**: Verify user role and account status

### **Debug Mode**

Enable debug mode in development:

```python
app.run(debug=True)
```

## 📈 Future Enhancements

### **Planned Features**

- **Advanced Analytics**: More detailed statistics and reports
- **Audit Logs**: Track all admin actions
- **API Rate Limiting**: Prevent abuse
- **Two-Factor Authentication**: Enhanced security
- **Backup & Restore**: Data management tools
- **Multi-language Support**: Additional languages

### **Integration Possibilities**

- **Email Notifications**: User activity alerts
- **External APIs**: Integration with mapping services
- **Mobile App**: Native mobile admin interface
- **Webhooks**: Real-time data synchronization

## 📞 Support

For technical support or feature requests:

- Check the main README.md for basic setup
- Review error logs for debugging
- Ensure all dependencies are installed
- Verify database connectivity

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Compatibility**: Python 3.7+, Flask 2.0+
