import { createReadStream, readdirSync } from 'node:fs';
import { join } from 'node:path';
import dataSource from '../../data-source';
import { Address } from '../entities/address.entity';
import { City } from '../entities/city.entity';
import { State } from '../entities/state.entity';

const DATA_DIRECTORY = join(__dirname, 'addresses-data');
const BATCH_SIZE = 1_000;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }

  fields.push(field.trim());
  return fields;
}

async function* readCsv(path: string): AsyncGenerator<string[]> {
  const stream = createReadStream(path, { encoding: 'utf8' });
  let remaining = '';

  for await (const chunk of stream) {
    const lines = `${remaining}${chunk}`.split(/\r?\n/);
    remaining = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim()) {
        yield parseCsvLine(line);
      }
    }
  }

  if (remaining.trim()) {
    yield parseCsvLine(remaining);
  }
}

async function seedStates(): Promise<Map<number, string>> {
  const repository = dataSource.getRepository(State);
  const states: Array<Pick<State, 'sourceId' | 'name' | 'code'>> = [];

  for await (const [sourceId, name, code] of readCsv(
    join(DATA_DIRECTORY, 'states.csv'),
  )) {
    states.push({ sourceId: Number(sourceId), name, code });
  }

  await repository.upsert(states, {
    conflictPaths: ['sourceId'],
    skipUpdateIfNoValuesChanged: true,
  });

  const persistedStates = await repository.find({
    select: { id: true, sourceId: true },
  });

  console.log(`Estados sincronizados: ${states.length}`);
  return new Map(persistedStates.map((state) => [state.sourceId, state.id]));
}

async function seedCities(
  stateIdsBySourceId: Map<number, string>,
): Promise<Map<number, string>> {
  const repository = dataSource.getRepository(City);
  let batch: Array<Pick<City, 'sourceId' | 'name' | 'stateId'>> = [];
  let total = 0;

  for await (const [sourceId, name, stateSourceId] of readCsv(
    join(DATA_DIRECTORY, 'cities.csv'),
  )) {
    const stateId = stateIdsBySourceId.get(Number(stateSourceId));
    if (!stateId) {
      throw new Error(
        `Estado ${stateSourceId} não encontrado para a cidade ${name}`,
      );
    }

    batch.push({ sourceId: Number(sourceId), name, stateId });

    if (batch.length === BATCH_SIZE) {
      await repository.upsert(batch, {
        conflictPaths: ['sourceId'],
        skipUpdateIfNoValuesChanged: true,
      });
      total += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await repository.upsert(batch, {
      conflictPaths: ['sourceId'],
      skipUpdateIfNoValuesChanged: true,
    });
    total += batch.length;
  }

  const persistedCities = await repository.find({
    select: { id: true, sourceId: true },
  });

  console.log(`Cidades sincronizadas: ${total}`);
  return new Map(persistedCities.map((city) => [city.sourceId, city.id]));
}

function addressFiles(): string[] {
  return readdirSync(DATA_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((directory) =>
      readdirSync(join(DATA_DIRECTORY, directory.name))
        .filter((file) => file.endsWith('.csv'))
        .map((file) => join(DATA_DIRECTORY, directory.name, file)),
    )
    .sort();
}

async function seedAddresses(
  stateIdsBySourceId: Map<number, string>,
  cityIdsBySourceId: Map<number, string>,
): Promise<void> {
  const repository = dataSource.getRepository(Address);
  let batch: Array<
    Pick<
      Address,
      | 'zipCode'
      | 'street'
      | 'complement'
      | 'neighborhood'
      | 'cityId'
      | 'stateId'
    >
  > = [];
  let total = 0;

  const persistBatch = async () => {
    await repository.upsert(batch, {
      conflictPaths: ['zipCode'],
      skipUpdateIfNoValuesChanged: true,
    });
    total += batch.length;
    batch = [];
  };

  for (const file of addressFiles()) {
    for await (const fields of readCsv(file)) {
      if (fields.length !== 6) {
        throw new Error(`Linha inválida em ${file}: ${fields.join(',')}`);
      }

      const [
        zipCode,
        street,
        complement,
        neighborhood,
        citySourceId,
        stateSourceId,
      ] = fields;
      const cityId = cityIdsBySourceId.get(Number(citySourceId));
      const stateId = stateIdsBySourceId.get(Number(stateSourceId));

      if (!cityId || !stateId) {
        throw new Error(
          `Cidade/estado não encontrado para o CEP ${zipCode} (${citySourceId}/${stateSourceId})`,
        );
      }

      batch.push({
        zipCode,
        street,
        complement: complement || null,
        neighborhood: neighborhood || null,
        cityId,
        stateId,
      });

      if (batch.length === BATCH_SIZE) {
        await persistBatch();
      }
    }
  }

  if (batch.length) {
    await persistBatch();
  }

  console.log(`Endereços sincronizados: ${total}`);
}

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    const stateIdsBySourceId = await seedStates();
    const cityIdsBySourceId = await seedCities(stateIdsBySourceId);
    await seedAddresses(stateIdsBySourceId, cityIdsBySourceId);
    console.log('Seeds concluídas com sucesso.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Erro ao executar seeds:', error);
  process.exitCode = 1;
});
