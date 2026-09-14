import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const required=['docker-compose.yml','.env.example','README.md','workflows/WF01_Ingestion_Gmail_GED.json','airtable/SCHEMA.md','docs/ARCHITECTURE.md','docs/TESTS.md'];
let failed=false;
for(const rel of required){if(!fs.existsSync(path.join(root,rel))){console.error('Missing',rel);failed=true;}}
for(const rel of required.filter(x=>x.endsWith('.json'))){const w=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));if(!w.nodes?.length||!w.connections) {console.error('Invalid workflow',rel);failed=true;} const names=new Set(w.nodes.map(n=>n.name)); for(const [from,v] of Object.entries(w.connections)){if(!names.has(from)) failed=true; for(const outputs of v.main||[]) for(const edge of outputs) if(!names.has(edge.node)){console.error('Broken edge',from,edge.node);failed=true;}}}
if(failed) process.exit(1); console.log('Validation OK');
