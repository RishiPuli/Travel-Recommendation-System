-- Update image URLs to point to local images
UPDATE destinations 
SET image_url = CASE id
    WHEN 1 THEN 'images/destinations/bali-paradise.jpg'
    WHEN 2 THEN 'images/destinations/paris-getaway.jpg'
    WHEN 3 THEN 'images/destinations/tokyo-adventure.jpg'
    WHEN 4 THEN 'images/destinations/santorini-sunset.jpg'
    WHEN 5 THEN 'images/destinations/new-york-city.jpg'
    WHEN 6 THEN 'images/destinations/sydney-harbor.jpg'
    WHEN 7 THEN 'images/destinations/dubai-luxury.jpg'
    WHEN 8 THEN 'images/destinations/bangkok-street-life.jpg'
    WHEN 9 THEN 'images/destinations/rome-history.jpg'
    WHEN 10 THEN 'images/destinations/cape-town-beauty.jpg'
END
WHERE id BETWEEN 1 AND 10; 