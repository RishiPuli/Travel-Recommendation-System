# Travel Recommendation System

Welcome to the Travel Recommendation System!  
This project helps you discover the best travel destinations, restaurants, and connect with fellow travelers based on your preferences.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [How to Use](#how-to-use)
5. [Image Processing (Optional)](#image-processing-optional)
6. [Troubleshooting](#troubleshooting)
7. [Credits](#credits)

---

## Features

- **Personalized Travel Recommendations**: Get destination suggestions based on your travel type, budget, season, and style.
- **Restaurant Finder**: Discover popular restaurants at each destination.
- **Social Features**: Add friends, join travel groups, and share experiences.
- **Wishlist**: Save destinations you want to visit.
- **User Reviews**: Read and write reviews for destinations.

---

## Project Structure

```
DBMS/
│
├── database.sql           # SQL file to set up the database and sample data
├── server.js              # Main backend server (Node.js + Express)
├── package.json           # Project dependencies and scripts
├── image-processor.js     # Script to convert images for the app (optional)
├── public/
│   ├── index.html         # Main web page
│   ├── script.js          # Frontend logic (JavaScript)
│   ├── styles.css         # Website styling (CSS)
│   └── images/
│       └── destinations/  # Destination images (auto-generated)
├── raw-images/            # Source images (WebP/JPG) for processing
├── fix-images.sql         # (Optional) SQL for image fixes
├── update-images.sql      # (Optional) SQL for updating images
└── README.md              # This file
```

---

## Setup Instructions

### 1. **Install Prerequisites**

- **Node.js** (Download from [nodejs.org](https://nodejs.org/))
- **MySQL** (Download from [mysql.com](https://www.mysql.com/))

### 2. **Clone the Repository**

```sh
git clone https://github.com/RishiPuli/Travel-Recommendation-System.git
cd Travel-Recommendation-System
```

### 3. **Install Node.js Dependencies**

```sh
npm install
```

### 4. **Set Up the Database**

1. Open MySQL Workbench or your preferred MySQL client.
2. Run the SQL script to create the database and tables:

   - Open the file `database.sql`
   - Copy all its contents and run it in your MySQL client.

   This will create a database called `travelrecommendationdb` and fill it with sample data.

3. **Update Database Credentials (if needed):**

   - Open `server.js`
   - Find the section:
     ```js
     const db = mysql.createConnection({
         host: 'localhost',
         user: 'root',
         password: 'rsvr@msi',
         database: 'travelrecommendationdb'
     });
     ```
   - Change `user` and `password` to match your MySQL setup.

### 5. **Start the Server**

```sh
npm start
```
or for development (auto-restarts on changes):
```sh
npm run dev
```

- The app will be available at: [http://localhost:3000](http://localhost:3000)

---

## How to Use

1. **Open your browser and go to [http://localhost:3000](http://localhost:3000)**
2. **Explore the Home Page**: Click "Get Started" to enter your travel preferences.
3. **View Recommendations**: See destinations tailored to your choices.
4. **Register/Login**: Create an account to save wishlists, write reviews, and use social features.
5. **Restaurants & Social**: Check out restaurants, add friends, and join travel groups.

---

## Image Processing (Optional)

If you want to update or add new destination images:

1. Place your `.webp` or `.jpg` images in the `raw-images/` folder.  
   Name them like: `bali-paradise.webp`, `paris-getaway.jpg`, etc.
2. Run the image processor:

   ```sh
   node image-processor.js
   ```

   This will convert and resize images, saving them to `public/images/destinations/`.

---

## Troubleshooting

- **Port Already in Use**: Change the port in `server.js` if 3000 is busy.
- **Database Errors**: Double-check your MySQL username, password, and that the database is created.
- **Images Not Showing**: Make sure you’ve run the image processor and images are in the right folder.

---

## Credits

- Project by [RishiPuli](https://github.com/RishiPuli)
- Built with Node.js, Express, MySQL, and vanilla JavaScript.

---

**Need help?**  
Open an issue on the [GitHub repository](https://github.com/RishiPuli/Travel-Recommendation-System) or contact the project maintainer.