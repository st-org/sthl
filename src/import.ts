import {createImporter} from '@ddu6/importer'
import type * as json5 from 'json5'
export const {getMod} = createImporter<{
    json5: {default: typeof json5}
}>({
    json5: 'https://cdn.jsdelivr.net/npm/json5@2.2.3/dist/index.min.mjs'
})