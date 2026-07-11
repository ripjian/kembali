// Video Generation Script
// Supports: xAI Grok Imagine Video (default) and fal.ai LTX-2 (--cheap)
//
// Usage:
//   npx tsx generate_video.ts -d /tmp/video.mp4 "A futuristic city at sunset"
//   npx tsx generate_video.ts --cheap -d /tmp/video.mp4 "A futuristic city"
//   npx tsx generate_video.ts -d /tmp/video.mp4 --image /path/to/image.jpg "Animate this scene"

import { fal } from '@fal-ai/client';
import { writeFileSync, readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ─── Argument Parsing ───

interface ParsedArgs {
  prompt: string;
  aspectRatio: string;
  duration: number;
  resolution: string;
  image: string | null;
  destination: string | null;
  cheap: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let aspectRatio = '16:9';
  let duration = 5;
  let resolution = '720p';
  let image: string | null = null;
  let destination: string | null = null;
  let cheap = false;
  let promptParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--aspect' || args[i] === '-a') {
      aspectRatio = args[++i];
    } else if (args[i] === '--duration' || args[i] === '-t') {
      duration = parseInt(args[++i], 10);
    } else if (args[i] === '--resolution' || args[i] === '-r') {
      resolution = args[++i];
    } else if (args[i] === '--image' || args[i] === '--assets') {
      image = args[++i];
    } else if (args[i] === '--destination' || args[i] === '-d') {
      destination = args[++i];
    } else if (args[i] === '--cheap' || args[i] === '-c') {
      cheap = true;
    } else {
      promptParts.push(args[i]);
    }
  }

  return { prompt: promptParts.join(' '), aspectRatio, duration, resolution, image, destination, cheap };
}

// ─── File Helpers ───

function copyToDestination(sourcePath: string, destPath: string): string {
  // Create parent directory if needed
  const dir = path.dirname(destPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let finalPath = destPath;
  if (existsSync(destPath)) {
    const ext = path.extname(destPath);
    const base = path.basename(destPath, ext);
    let counter = 1;
    while (existsSync(finalPath)) {
      finalPath = path.join(dir, `${base}_${counter}${ext}`);
      counter++;
    }
  }
  copyFileSync(sourcePath, finalPath);
  return finalPath;
}

// ─── Grok Imagine Video (xAI) ───

async function generateWithGrok(args: ParsedArgs): Promise<void> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error('Error: XAI_API_KEY not found in .env');
    console.error('Get your key at https://console.x.ai/team/default/api-keys');
    process.exit(1);
  }

  const baseUrl = 'https://api.x.ai/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Build request body
  const body: any = {
    model: 'grok-imagine-video',
    prompt: args.prompt,
    duration: args.duration,
    aspect_ratio: args.aspectRatio,
    resolution: args.resolution,
  };

  // Image-to-video mode
  if (args.image) {
    console.log(`Mode: Image-to-Video`);
    console.log(`Source image: ${args.image}`);
    const imageBuffer = readFileSync(args.image);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(args.image).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    body.image = { url: `data:${mimeType};base64,${base64}` };
  } else {
    console.log(`Mode: Text-to-Video`);
  }

  console.log(`Provider: xAI Grok Imagine Video`);
  console.log(`Duration: ${args.duration}s | Ratio: ${args.aspectRatio} | Resolution: ${args.resolution}`);
  console.log(`Prompt: "${args.prompt}"`);
  console.log('');

  // Step 1: Start generation
  console.log('Starting video generation...');
  const startRes = await fetch(`${baseUrl}/videos/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    console.error(`API error (${startRes.status}): ${err}`);
    process.exit(1);
  }

  const startData = await startRes.json() as any;
  const requestId = startData.request_id;
  console.log(`Request ID: ${requestId}`);

  // Step 2: Poll for completion
  console.log('Generating video (this may take a few minutes)...');
  const maxWait = 10 * 60 * 1000; // 10 minutes
  const pollInterval = 3000; // 3 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/videos/${requestId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    if (!pollRes.ok) {
      console.error(`Poll error (${pollRes.status}): ${await pollRes.text()}`);
      continue;
    }

    const pollData = await pollRes.json() as any;
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    // API returns video object directly when done (no status field)
    if (pollData.video?.url) {
      console.log(`\nVideo ready! (took ${elapsed}s)`);
      const videoUrl = pollData.video.url;

      // Download video
      console.log('Downloading video...');
      const videoRes = await fetch(videoUrl);
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
      const localFile = 'video_output.mp4';
      writeFileSync(localFile, videoBuffer);
      console.log(`Saved: ${localFile} (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

      if (args.destination) {
        const finalPath = copyToDestination(localFile, args.destination);
        console.log(`Copied to: ${finalPath}`);
      }
      return;
    } else if (pollData.status === 'expired' || pollData.error) {
      console.error('Video generation failed:', JSON.stringify(pollData));
      process.exit(1);
    } else {
      const status = pollData.status || 'processing';
      process.stdout.write(`\r  Waiting... ${elapsed}s elapsed (status: ${status})`);
    }
  }

  console.error('\nTimeout: video generation took too long (>10 minutes)');
  process.exit(1);
}

// ─── LTX-2 via fal.ai (cheap mode) ───

async function generateWithLtx(args: ParsedArgs): Promise<void> {
  if (!process.env.FAL_KEY) {
    console.error('Error: FAL_KEY not found in .env');
    process.exit(1);
  }

  fal.config({ credentials: process.env.FAL_KEY });

  console.log(`Provider: fal.ai LTX-2 (cheap mode)`);
  console.log(`Duration: ${args.duration}s | Ratio: ${args.aspectRatio}`);
  console.log(`Prompt: "${args.prompt}"`);
  console.log('');

  // Map aspect ratio to resolution
  const resMap: Record<string, { width: number; height: number }> = {
    '16:9': { width: 768, height: 432 },
    '9:16': { width: 432, height: 768 },
    '1:1': { width: 512, height: 512 },
    '4:3': { width: 640, height: 480 },
    '3:4': { width: 480, height: 640 },
    '3:2': { width: 640, height: 432 },
    '2:3': { width: 432, height: 640 },
  };
  const res = resMap[args.aspectRatio] || resMap['16:9'];

  let result: any;

  if (args.image) {
    // Image-to-video
    console.log(`Mode: Image-to-Video`);
    const fileBuffer = readFileSync(args.image);
    const file = new File([fileBuffer], path.basename(args.image), {
      type: 'image/jpeg',
    });
    const imageUrl = await fal.storage.upload(file);
    console.log(`Image uploaded: ${imageUrl}`);

    result = await fal.subscribe('fal-ai/ltx-2/image-to-video', {
      input: {
        prompt: args.prompt,
        image_url: imageUrl,
        num_frames: Math.min(args.duration * 24, 257),
        width: res.width,
        height: res.height,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
  } else {
    // Text-to-video
    console.log(`Mode: Text-to-Video`);

    result = await fal.subscribe('fal-ai/ltx-2/text-to-video', {
      input: {
        prompt: args.prompt,
        num_frames: Math.min(args.duration * 24, 257),
        width: res.width,
        height: res.height,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
  }

  // Download result
  const videoUrl = result.data?.video?.url;
  if (!videoUrl) {
    console.error('No video URL in response');
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('Downloading video...');
  const videoRes = await fetch(videoUrl);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const localFile = 'video_output.mp4';
  writeFileSync(localFile, videoBuffer);
  console.log(`Saved: ${localFile} (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

  if (args.destination) {
    const finalPath = copyToDestination(localFile, args.destination);
    console.log(`Copied to: ${finalPath}`);
  }
}

// ─── Main ───

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.prompt && !args.image) {
    console.error('Usage: npx tsx generate_video.ts [OPTIONS] "your prompt"');
    console.error('');
    console.error('Options:');
    console.error('  --cheap, -c          Use fal.ai LTX-2 (fast, low cost)');
    console.error('  --image <path>       Source image for image-to-video');
    console.error('  --duration, -t <s>   Duration in seconds (default: 5)');
    console.error('  --aspect, -a <ratio> Aspect ratio (default: 16:9)');
    console.error('  --resolution, -r     Resolution: 480p or 720p (Grok only, default: 720p)');
    console.error('  --destination, -d    Output file path');
    console.error('');
    console.error('Providers:');
    console.error('  Default:  xAI Grok Imagine Video (high quality, 720p, up to 15s)');
    console.error('  --cheap:  fal.ai LTX-2 (fast, budget-friendly)');
    process.exit(1);
  }

  if (args.cheap) {
    await generateWithLtx(args);
  } else {
    await generateWithGrok(args);
  }
}

main();
