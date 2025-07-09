const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const inputDir = path.join(__dirname, 'raw-images');
const outputDir = path.join(__dirname, 'public', 'images', 'destinations');

if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Image processing configuration
const config = {
    width: 800,
    height: 600,
    fit: 'cover',
    position: 'center',
    quality: 80,
    format: 'jpeg'
};

// List of destination images to process
const destinations = [
    'bali-paradise',
    'paris-getaway',
    'tokyo-adventure',
    'santorini-sunset',
    'new-york-city',
    'sydney-harbor',
    'dubai-luxury',
    'bangkok-street-life',
    'rome-history',
    'cape-town-beauty'
];

async function processImage(inputPath, outputPath) {
    try {
        // Read the input image
        const inputBuffer = fs.readFileSync(inputPath);
        
        // Process the image
        await sharp(inputBuffer)
            .resize(config.width, config.height, {
                fit: config.fit,
                position: config.position
            })
            .jpeg({ 
                quality: config.quality,
                mozjpeg: true // Use mozjpeg for better compression
            })
            .toFile(outputPath);
        
        console.log(`Successfully processed: ${path.basename(inputPath)}`);
    } catch (error) {
        console.error(`Error processing ${inputPath}:`, error);
    }
}

async function processAllImages() {
    console.log('Starting image processing...');
    
    for (const destination of destinations) {
        // Try both .webp and .jpg extensions
        const inputPathWebP = path.join(inputDir, `${destination}.webp`);
        const inputPathJpg = path.join(inputDir, `${destination}.jpg`);
        const outputPath = path.join(outputDir, `${destination}.jpg`);
        
        if (fs.existsSync(inputPathWebP)) {
            await processImage(inputPathWebP, outputPath);
        } else if (fs.existsSync(inputPathJpg)) {
            await processImage(inputPathJpg, outputPath);
        } else {
            console.warn(`Warning: Input file not found for ${destination} (tried .webp and .jpg)`);
        }
    }
    
    console.log('Image processing completed!');
}

// Run the processor
processAllImages().catch(console.error); 