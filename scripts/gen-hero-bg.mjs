#!/usr/bin/env node
/**
 * Generates the Hero background image via Picsart Text2Image API.
 * Saves result to public/hero-bg.jpg
 *
 * Usage: node scripts/gen-hero-bg.mjs
 * Requires: PICSART_API_KEY in environment (or hardcoded below for local use)
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
  'Close-up of fresh green herbs, vegetables and produce on warm cream linen surface, ' +
  'soft natural side lighting, minimal depth of field, professional food still life photography, ' +
  'clean negative space on right side, warm ivory and sage tones, high detail texture, ' +
  'editorial magazine quality, no people, no faces, no text, no watermark';

const NEGATIVE_PROMPT =
  'people, faces, text, watermark, ugly, blurry, dark background, neon, artificial light, ' +
  'synthetic, digital art, illustration, cartoon, neural network, tech aesthetic';

async function generate() {
  console.log('🎨 Starting Picsart Text2Image generation...');

  // Step 1: Submit generation job
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

  // Step 2: Poll for result
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
      // Find the image URL in the response
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

  // Step 3: Download and save
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    console.error('❌ Failed to download image:', imgRes.status);
    process.exit(1);
  }

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const outPath = join(__dirname, '..', 'public', 'hero-bg.jpg');
  writeFileSync(outPath, buffer);
  console.log(`✅ Saved to: public/hero-bg.jpg (${(buffer.length / 1024).toFixed(0)} KB)`);
}

generate().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
