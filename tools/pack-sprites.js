import texturePacker from 'free-tex-packer-core';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHIPS_DIR = path.join(__dirname, '../PixelArtAssets/Space_Ships');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/ships');

async function processImage(imagePath) {
    const image = await sharp(imagePath);
    const metadata = await image.metadata();
    const buffer = await image.toBuffer();
    
    return {
        path: path.basename(imagePath),
        contents: buffer,
        width: metadata.width,
        height: metadata.height
    };
}

function packTexturesPromise(images, options) {
    return new Promise((resolve, reject) => {
        texturePacker(images, options, (files, error) => {
            if (error) reject(error);
            else resolve(files);
        });
    });
}

async function extractFramesFromGif(gifPath) {
    const frames = [];
    let frameIndex = 0;
    
    try {
        const image = sharp(gifPath);
        const metadata = await image.metadata();
        
        if (metadata.pages > 1) {
            // Extract each frame from the GIF
            for (let i = 0; i < metadata.pages; i++) {
                const frame = await sharp(gifPath, { page: i })
                    .toBuffer();
                
                frames.push({
                    path: `spike_${frameIndex + 1}.png`,
                    contents: frame,
                    width: metadata.width,
                    height: metadata.height
                });
                frameIndex++;
            }
        }
    } catch (err) {
        console.error('Error extracting frames from GIF:', err);
    }
    
    return frames;
}

async function packShipSprites(shipName, frames) {
    console.log(`Packing sprites for ${shipName}...`);
    
    try {
        let images;
        
        // Special handling for Spike GIF
        if (shipName === 'spike' && frames.some(f => f.endsWith('.gif'))) {
            const gifPath = frames.find(f => f.endsWith('.gif'));
            images = await extractFramesFromGif(gifPath);
        } else {
            // Process regular frames
            images = await Promise.all(frames.map(frame => processImage(frame)));
        }
        
        if (images.length === 0) {
            console.error(`No frames found for ${shipName}`);
            return;
        }
        
        // Pack options
        const options = {
            textureName: shipName,
            width: 2048,
            height: 2048,
            fixedSize: false,
            padding: 2,
            allowRotation: false,
            detectIdentical: true,
            allowTrim: false,
            exporter: "JsonHash",
            removeFileExtension: true,
            prependFolderName: false
        };

        // Pack sprites
        const files = await packTexturesPromise(images, options);
        
        // Ensure output directory exists
        const outputPath = path.join(OUTPUT_DIR, shipName);
        await fs.mkdir(outputPath, { recursive: true });

        // Save atlas and image
        for (let item of files) {
            const filePath = path.join(outputPath, item.name);
            await fs.writeFile(filePath, item.buffer);
        }

        console.log(`✓ Packed ${shipName} sprites successfully`);
    } catch (err) {
        console.error(`Error packing ${shipName}:`, err);
    }
}

async function findShipFrames(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const ships = {};

    for (const entry of entries) {
        if (entry.isDirectory()) {
            // Recursively search directories
            const subDirShips = await findShipFrames(path.join(directory, entry.name));
            Object.assign(ships, subDirShips);
        } else if (entry.isFile() && /\.(png|jpg|jpeg|gif)$/i.test(entry.name)) {
            // Extract ship name and frame number
            const match = entry.name.match(/^([a-zA-Z0-9_-]+?)(?:[-_](\d+))?\.[^.]+$/);
            if (match) {
                const shipName = match[1].toLowerCase();
                if (!ships[shipName]) {
                    ships[shipName] = [];
                }
                ships[shipName].push(path.join(directory, entry.name));
            }
        }
    }

    return ships;
}

async function main() {
    try {
        // Create output directory
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Find all ship frames
        console.log('Scanning for ship sprites...');
        const ships = await findShipFrames(SHIPS_DIR);

        // Pack each ship's sprites
        for (const [shipName, frames] of Object.entries(ships)) {
            if (frames.length > 0) {
                await packShipSprites(shipName, frames);
            }
        }

        console.log('Sprite packing complete!');
    } catch (err) {
        console.error('Error:', err);
    }
}

main(); 