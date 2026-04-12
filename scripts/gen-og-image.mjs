#!/usr/bin/env node
/**
 * Generates the OG (Open Graph) image via Picsart Text2Image API.
 * Saves result to public/og-image.png
 *
 * Usage: node scripts/gen-og-image.mjs
 * Requires: PICSART_API_KEY in environment
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PICSART_API_KEY;

if (!API_KEY) {
  console.error('❌ PICSART_API_KEY not set. Export it or add to .env');
  process.exit(1);
}

const PROMPT =
  'Abstract minimalist visualization: subtle grid lines and gentle upward trend curve ' +
  'overlaid on warm cream background, tiny data points along the line, ' +
  'watercolor-like sage green accent stroke, generous white space, ' +
  'professional brand visual, clean editorial aesthetic, no text, no watermark, no faces, no people';

const NEGATIVE_PROMPT =
  'people, faces, text, watermark, dark, neon, tech, circuits, blurry, cartoon, ' +
  'illustration, cluttered, busy, dark background';

async function generate() {
  console.log('🎨 Starting Picsart Text2Image generation (OG image)...');

  const submitRes = await fetch('https://genai-api.picsart.io/v1/text2image', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'X-Picsart-API-Key': API_KEY,
    },
    body: JSON.stringify({
      prompt: PROMPT,
      negative_prompt: NEGATIVE_PROMPT,
      width: 1024,
      height: 1024,
      count: 1,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    console.error('❌ Submit failed:', submitRes.status, err);
    process.exit(1);
  }

  const submitData = await submitRes.json();
  const transactionId = submitData?.inference_id || submitData?.transaction_id || submitData?.data?.transaction_id;

  if (!transactionId) {
    console.error('❌ No transaction_id in response:', JSON.stringify(submitData, null, 2));
    process.exit(1);
  }
  console.log(`✅ Job submitted. Transaction ID: ${transactionId}`);

  let imageUrl = null;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    process.stdout.write(`⏳ Polling... attempt ${attempts}/${maxAttempts}\r`);

    const pollRes = await fetch(`https://genai-api.picsart.io/v1/text2image/inferences/${transactionId}`, {
      headers: {
        'accept': 'application/json',
        'X-Picsart-API-Key': API_KEY,
      },
    });

    if (!pollRes.ok) {
      console.log(`\n⚠️  Poll returned ${pollRes.status}, retrying...`);
      continue;
    }

    const pollData = await pollRes.json();
    const status = pollData?.status || pollData?.data?.status;

    if (status === 'SUCCESS' || status === 'success') {
      imageUrl =
        pollData?.data?.url ||
        pollData?.url ||
        pollData?.data?.[0]?.url ||
        pollData?.images?.[0]?.url;

      if (!imageUrl) {
        console.log('\n📦 Full response:', JSON.stringify(pollData, null, 2));
        console.error('❌ Could not find image URL in response');
        process.exit(1);
      }
      break;
    } else if (status === 'FAILED' || status === 'failed' || status === 'error') {
      console.error('\n❌ Generation failed:', JSON.stringify(pollData, null, 2));
      process.exit(1);
    }
  }

  if (!imageUrl) {
    console.error('\n❌ Timed out waiting for result');
    process.exit(1);
  }

  console.log(`\n✅ Image generated: ${imageUrl}`);

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    console.error('❌ Failed to download image:', imgRes.status);
    process.exit(1);
  }

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const outPath = join(__dirname, '..', 'public', 'og-image.png');
  writeFileSync(outPath, buffer);
  console.log(`✅ Saved to: public/og-image.png (${(buffer.length / 1024).toFixed(0)} KB)`);
}

generate().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
