import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const materialsRoot = path.join(root, 'materials');
const schemaPath = path.join(root, 'schemas', 'material-card.schema.json');
JSON.parse(await readFile(schemaPath, 'utf8'));

function findMaterialCards(directory) {
  const cards = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) cards.push(...findMaterialCards(entryPath));
    else if (entry.name === 'material.json') cards.push(entryPath);
  }
  return cards;
}

function validateCard(cardPath) {
  const materialRoot = path.dirname(cardPath);
  const card = JSON.parse(readFileSync(cardPath, 'utf8'));
  const errors = [];
  const required = [
    'id', 'name', 'category', 'status', 'sourceType', 'sourceFiles', 'license',
    'realWorldWidthMeters', 'realWorldHeightMeters', 'defaultRepeat', 'mappingMethods',
    'baseColorMap', 'roughness', 'metalness', 'colorSpace', 'seamless', 'variants',
    'createdAt', 'updatedAt',
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
    if (card[field] && !existsSync(path.join(materialRoot, card[field]))) errors.push(`missing map file: ${card[field]}`);
  }
  for (const sourceFile of card.sourceFiles ?? []) {
    if (!existsSync(path.join(materialRoot, sourceFile))) errors.push(`missing source file: ${sourceFile}`);
  }
  return { card, errors };
}

const cards = findMaterialCards(materialsRoot).map(validateCard);
const duplicateIds = cards.map(({ card }) => card.id).filter((id, index, all) => all.indexOf(id) !== index);
const errors = cards.flatMap(({ card, errors: cardErrors }) => cardErrors.map((error) => `${card.id}: ${error}`));
if (duplicateIds.length) errors.push(`duplicate material IDs: ${[...new Set(duplicateIds)].join(', ')}`);

if (errors.length > 0) {
  console.error('Material validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${cards.length} material cards: ${cards.map(({ card }) => card.id).join(', ')}.`);
  for (const { card } of cards) {
    if (card.scaleStatus === 'unverified') console.log(`Note: ${card.id} physical dimensions remain provisional.`);
  }
}
