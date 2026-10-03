import fs from 'node:fs/promises';
import path from 'node:path';
import { validateLevel } from '../src/editor/LevelValidator.js';

const levelsDir = path.resolve(
  process.cwd(),
  'public/levels',
);

const index = JSON.parse(
  await fs.readFile(
    path.join(
      levelsDir,
      'index.json',
    ),
    'utf8',
  ),
);

let failed = false;

for (const entry of index) {
  const levelPath = path.join(
    levelsDir,
    `${entry.id}.json`,
  );

  const level = JSON.parse(
    await fs.readFile(
      levelPath,
      'utf8',
    ),
  );

  const result =
    validateLevel(level);

  if (!result.valid) {
    failed = true;
    console.error(
      `\nLevel "${entry.id}" failed validation:\n`,
    );

    for (
      const error of
      result.errors
    ) {
      console.error(
        `- ${error}`,
      );
    }
  } else {
    console.log(
      `✓ ${entry.id}: ${result.metrics.objects} objects, ${result.metrics.navNodes} nav nodes, ${result.metrics.navEdges} nav edges, ${result.metrics.npcs} NPCs`,
    );
  }

  for (
    const warning of
    result.warnings
  ) {
    console.warn(
      `  warning: ${warning}`,
    );
  }
}

if (failed) {
  process.exit(1);
}
