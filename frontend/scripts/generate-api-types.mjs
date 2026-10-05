import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import prettier from 'prettier'
import openapiTS, { astToString } from 'openapi-typescript'
import ts from 'typescript'

const input = process.argv[2] ?? 'http://localhost:8000/api/openapi.json'
const source = /^https?:\/\//.test(input) ? new URL(input) : pathToFileURL(resolve(input))
const declarations = astToString(await openapiTS(source))
const file = ts.createSourceFile('schema.d.ts', declarations, ts.ScriptTarget.Latest, true)
const result = ts.createPrinter({ removeComments: true }).printFile(file)
const destination = new URL('../src/api/schema.d.ts', import.meta.url)
const config = await prettier.resolveConfig(fileURLToPath(destination))
await writeFile(destination, prettier.format(result, { ...config, parser: 'typescript' }))
