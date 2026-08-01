import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const materialRoot = path.join(root, 'materials', 'concrete', 'concrete-pebble-001');
const cardPath = path.join(materialRoot, 'material.json');
const schemaPath = path.join(root, 'schemas', 'material-card.schema.json');
const card = JSON.parse(await readFile(cardPath, 'utf8'));
JSON.parse(await readFile(schemaPath, 'utf8'));

const errors = [];
const required = [
  'id',
  'name',
  'category',
  'status',
  'sourceType',
  'sourceFiles',
  'license',
  'realWorldWidthMeters',
  'realWorldHeightMeters',
  'defaultRepeat',
  'mappingMethods',
  'baseColorMap',
  'roughness',
  'metalness',
  'colorSpace',
  'seamless',
  'variants',
  'createdAt',
  'updatedAt',
];

for (const field of required) {
  if (!Object.hasOwn(card, field)) errors.push(`missing required field: ${field}`);
}

if (!/^MAT-[A-Z0-9-]+$/.test(card.id ?? '')) errors.push('invalid stable material ID');
if (!Array.isArray(card.sourceFiles) || card.sourceFiles.length === 0) errors.push('sourceFiles must contain at least one file');
if (!Array.isArray(card.defaultRepeat) || card.defaultRepeat.length !== 2) errors.push('defaultRepeat must contain two values');
if (!(card.realWorldWidthMeters > 0) || !(card.realWorldHeightMeters > 0)) errors.push('real-world dimensions must be positive');
if (card.roughness < 0 || card.roughness > 1) errors.push('roughness must be between 0 and 1');
if (card.metalness < 0 || card.metalness > 1) errors.push('metalness must be between 0 and 1');

const mapFields = ['baseColorMap', 'normalMap', 'roughnessMap', 'heightMap', 'aoMap', 'metalnessMap', 'opacityMap'];
for (const field of mapFields) {
  if (!Object.hasOwn(card, field)) errors.push(`map field must be explicit: ${field}`);
  if (card[field]) {
    const mapPath = path.join(materialRoot, card[field]);
    if (!existsSync(mapPath)) errors.push(`missing map file: ${card[field]}`);
  }
}

for (const sourceFile of card.sourceFiles ?? []) {
  const sourcePath = path.join(materialRoot, sourceFile);
  if (!existsSync(sourcePath)) errors.push(`missing source file: ${sourceFile}`);
}

if (errors.length > 0) {
  console.error('Material validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${card.id}: required fields, explicit map slots, dimensions, and package files are present.`);
  if (card.scaleStatus === 'unverified') {
    console.log('Note: physical dimensions remain provisional and require measurement before close-up approval.');
  }
}
