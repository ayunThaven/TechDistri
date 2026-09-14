import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'workflows');
fs.mkdirSync(out, { recursive: true });

let seq = 0;
const id = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
const node = (name, type, typeVersion, position, parameters = {}, extra = {}) => ({
  id: id(), name, type, typeVersion, position, parameters, ...extra,
});
const connect = (connections, from, to, output = 0) => {
  connections[from] ??= { main: [] };
  while (connections[from].main.length <= output) connections[from].main.push([]);
  connections[from].main[output].push({ node: to, type: 'main', index: 0 });
};
const airtableAuth = { httpHeaderAuth: { id: 'REPLACE_AIRTABLE_CREDENTIAL', name: 'Airtable PAT - TechDistri' } };
const driveAuth = { googleDriveOAuth2Api: { id: 'REPLACE_DRIVE_CREDENTIAL', name: 'Google Drive OAuth2 - TechDistri' } };
const gmailAuth = { gmailOAuth2: { id: 'REPLACE_GMAIL_CREDENTIAL', name: 'Gmail OAuth2 - techdistriesgi@gmail.com' } };
const httpGet = (url, query = []) => ({
  url, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
  sendQuery: query.length > 0, queryParameters: { parameters: query }, options: {},
});
const httpJson = (method, url, jsonBody, auth = 'airtable') => ({
  method, url, authentication: auth === 'airtable' ? 'genericCredentialType' : 'predefinedCredentialType',
  ...(auth === 'airtable' ? { genericAuthType: 'httpHeaderAuth' } : { nodeCredentialType: auth }),
  sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody,
  options: { response: { response: { neverError: false, responseFormat: 'json' } } },
});

const normalizeCode = `const j = $json;
const headerList = j.payload?.headers || [];
const headers = Object.fromEntries(headerList.map(h => [String(h.name).toLowerCase(), h.value]));
const headerText = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(headerText).find(Boolean) || '';
  if (value && typeof value === 'object') {
    const email = headerText(value.email || value.address || value.value || value.text || '');
    const name = headerText(value.name || value.displayName || '');
    return email ? (name ? name + ' <' + email + '>' : email) : '';
  }
  return '';
};
const fromRaw = [j.from, j.From, j.headers?.from, headers.from].map(headerText).find(Boolean) || '';
const match = String(fromRaw).match(/^(.*?)<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})>?$/i);
const senderEmail = (match?.[2] || fromRaw).trim().toLowerCase();
const senderName = (match?.[1] || '').replace(/[\"<>]/g, '').trim();
const domain = senderEmail.includes('@') ? senderEmail.split('@').pop() : 'inconnu.local';
const generic = /^(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|protonmail)\\./i.test(domain);
const clientKey = generic ? senderEmail : domain;
const baseName = generic ? senderEmail.split('@')[0] : domain.split('.')[0];
const clientName = baseName.replace(/[._-]+/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
const folderSlug = clientKey.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9@._-]+/gi, '-').slice(0, 90);
const binaryKeys = Object.keys($binary || {});
const received = j.date || j.internalDate || j.headers?.date || headers.date || new Date().toISOString();
const receivedIso = /^\\d+$/.test(String(received)) ? new Date(Number(received)).toISOString() : new Date(received).toISOString();
return { json: {
  gmailId: j.id, threadId: j.threadId || '', rfcMessageId: j.headers?.['message-id'] || headers['message-id'] || '',
  subject: j.subject || j.Subject || j.headers?.subject || headers.subject || '(sans objet)',
  senderEmail, senderName, domain, clientKey, clientName, folderSlug, receivedIso,
  bodyText: j.text || j.textPlain || j.snippet || '', attachmentCount: binaryKeys.length,
  binaryKeys, processedAt: new Date().toISOString(), executionId: $execution.id
}, binary: $binary };`;

const mainNodes = [];
mainNodes.push(node('Gmail toutes les 5 minutes', 'n8n-nodes-base.gmailTrigger', 1, [-1600, 0], {
  authentication: 'oAuth2', event: 'messageReceived', simple: false, maxResults: 10,
  pollTimes: { item: [{ mode: 'everyX', value: 5, unit: 'minutes' }] },
  filters: { q: 'in:inbox', readStatus: 'both', includeDrafts: false, includeSpamTrash: false },
  options: { downloadAttachments: true, dataPropertyAttachmentsPrefixName: 'attachment_' },
}, { credentials: gmailAuth }));
mainNodes.push(node('Normaliser email', 'n8n-nodes-base.code', 2, [-1360, 80], { mode: 'runOnceForEachItem', jsCode: normalizeCode }));
mainNodes.push(node('Chercher mail Airtable', 'n8n-nodes-base.httpRequest', 4.4, [-1120, 80], httpGet('=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_MAILS_TABLE_ID}}', [
  { name: 'filterByFormula', value: `={{ "{Gmail Message ID}='" + $('Normaliser email').item.json.gmailId.replace(/'/g, "\\\\'") + "'" }}` },
  { name: 'maxRecords', value: '1' },
]), { credentials: airtableAuth }));
mainNodes.push(node('Mail déjà connu ?', 'n8n-nodes-base.if', 2.2, [-900, 80], { conditions: { options: { version: 2, caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ leftValue: '={{ ($json.records || []).length }}', rightValue: 0, operator: { type: 'number', operation: 'gt' } }] } }));
mainNodes.push(node('Ignorer doublon', 'n8n-nodes-base.noOp', 1, [-680, -40], {}));
mainNodes.push(node('Chercher client Airtable', 'n8n-nodes-base.httpRequest', 4.4, [-680, 220], httpGet('=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_CLIENTS_TABLE_ID}}', [
  { name: 'filterByFormula', value: `={{ "{Identifiant client}='" + $('Normaliser email').item.json.clientKey.replace(/'/g, "\\\\'") + "'" }}` },
  { name: 'maxRecords', value: '1' },
]), { credentials: airtableAuth }));
mainNodes.push(node('Client trouvé ?', 'n8n-nodes-base.if', 2.2, [-440, 220], { conditions: { options: { version: 2, caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ leftValue: '={{ ($json.records || []).length }}', rightValue: 0, operator: { type: 'number', operation: 'gt' } }] } }));
mainNodes.push(node('Contexte client existant', 'n8n-nodes-base.code', 2, [-180, 140], { mode: 'runOnceForEachItem', jsCode: `const c=$json.records[0]; const s=$('Normaliser email').item; return {json:{...s.json,clientRecordId:c.id,clientFolderId:c.fields['Dossier Drive ID']||''},binary:s.binary};` }));
mainNodes.push(node('Chercher dossier Drive', 'n8n-nodes-base.httpRequest', 4.4, [-180, 320], {
  url: 'https://www.googleapis.com/drive/v3/files', authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api', sendQuery: true,
  queryParameters: { parameters: [
    { name: 'q', value: `={{ "name='" + $('Normaliser email').item.json.folderSlug.replace(/'/g, "\\\\'") + "' and mimeType='application/vnd.google-apps.folder' and '" + $env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID + "' in parents and trashed=false" }}` },
    { name: 'fields', value: 'files(id,name,webViewLink)' }, { name: 'pageSize', value: '1' },
  ] }, options: {},
}, { credentials: driveAuth }));
mainNodes.push(node('Dossier trouvé ?', 'n8n-nodes-base.if', 2.2, [60, 320], { conditions: { options: { version: 2, caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ leftValue: '={{ ($json.files || []).length }}', rightValue: 0, operator: { type: 'number', operation: 'gt' } }] } }));
mainNodes.push(node('Contexte dossier existant', 'n8n-nodes-base.code', 2, [300, 260], { mode: 'runOnceForEachItem', jsCode: `const s=$('Normaliser email').item; const f=$json.files[0]; return {json:{...s.json,clientFolderId:f.id,clientFolderUrl:f.webViewLink||('https://drive.google.com/drive/folders/'+f.id)},binary:s.binary};` }));
mainNodes.push(node('Créer dossier Drive', 'n8n-nodes-base.httpRequest', 4.4, [300, 400], httpJson('POST', 'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', `={{ JSON.stringify({name:$('Normaliser email').item.json.folderSlug,mimeType:'application/vnd.google-apps.folder',parents:[$env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID]}) }}`, 'googleDriveOAuth2Api'), { credentials: driveAuth }));
mainNodes.push(node('Contexte dossier créé', 'n8n-nodes-base.code', 2, [540, 400], { mode: 'runOnceForEachItem', jsCode: `const s=$('Normaliser email').item; return {json:{...s.json,clientFolderId:$json.id,clientFolderUrl:$json.webViewLink||('https://drive.google.com/drive/folders/'+$json.id)},binary:s.binary};` }));
mainNodes.push(node('Préparer requête Client', 'n8n-nodes-base.code', 2, [600, 320], { mode: 'runOnceForEachItem', jsCode: `return {json:{...$json,airtableClientPayload:{records:[{fields:{'Nom client':$json.clientName,'Identifiant client':$json.clientKey,'Dossier Drive ID':$json.clientFolderId}}]}}};` }));
mainNodes.push(node('Créer client Airtable', 'n8n-nodes-base.httpRequest', 4.4, [840, 320], httpJson('POST', '=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_CLIENTS_TABLE_ID}}', `={{ JSON.stringify($json.airtableClientPayload) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Contexte client créé', 'n8n-nodes-base.code', 2, [1020, 320], { mode: 'runOnceForEachItem', jsCode: `const s=$('Normaliser email').item; const f=$('Créer client Airtable').item.json.records[0].fields; return {json:{...s.json,clientRecordId:$json.records[0].id,clientFolderId:f['Dossier Drive ID']},binary:s.binary};` }));
mainNodes.push(node('Préparer requête Mail', 'n8n-nodes-base.code', 2, [1100, 160], { mode: 'runOnceForEachItem', jsCode: `return {json:{...$json,airtableMailPayload:{records:[{fields:{'Gmail Message ID':$json.gmailId,'Client':[$json.clientRecordId],'Sujet':$json.subject,'Expéditeur':$json.senderEmail,'Date réception':$json.receivedIso,'Corps texte':$json.bodyText,'Statut':'EN_COURS','Détail erreur':''}}]}}};` }));
mainNodes.push(node('Créer mail Airtable', 'n8n-nodes-base.httpRequest', 4.4, [1260, 160], httpJson('POST', '=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_MAILS_TABLE_ID}}', `={{ JSON.stringify($json.airtableMailPayload) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Préparer pièces jointes', 'n8n-nodes-base.code', 2, [1500, 160], { mode: 'runOnceForAllItems', jsCode: `return $input.all().flatMap((item,index)=>{const s=$('Normaliser email').all()[index]||item; const m=item.json.records?.[0] || {id:item.json.mailRecordId,fields:{Client:[item.json.clientRecordId],'Dossier Drive ID':item.json.clientFolderId}}; const folder=m.fields['Dossier Drive ID']; const keys=Object.keys(s.binary||{}); if(!keys.length) return [{json:{...s.json,mailRecordId:m.id,clientRecordId:m.fields.Client[0],clientFolderId:folder,hasAttachment:false}}]; return keys.map((k,i)=>{const b=s.binary[k]; const original=b.fileName||('piece-jointe-'+(i+1)); const safe=original.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-120); const stamp=s.json.receivedIso.replace(/[-:]/g,'').replace('T','_').slice(0,13); const archived=stamp+'_'+s.json.gmailId.slice(-10)+'_'+safe; return {json:{...s.json,mailRecordId:m.id,clientRecordId:m.fields.Client[0],clientFolderId:folder,hasAttachment:true,binaryKey:k,originalName:original,archivedName:archived,fileKey:s.json.gmailId+'::'+k,mimeType:b.mimeType||'application/octet-stream',fileSize:Number(b.fileSize||0),extension:(original.split('.').pop()||'').toLowerCase()},binary:{data:b}};});});` }));
mainNodes.push(node('Avec pièce jointe ?', 'n8n-nodes-base.if', 2.2, [1740, 160], { conditions: { options: { version: 2, caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ leftValue: '={{ $json.hasAttachment }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] } }));
mainNodes.push(node('Terminer mail sans PJ', 'n8n-nodes-base.httpRequest', 4.4, [1980, 20], httpJson('PATCH', '=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_MAILS_TABLE_ID}}/{{$json.mailRecordId}}', `={{ JSON.stringify({fields:{Statut:'TERMINE','Détail erreur':''}}) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Préparer requête Fichier', 'n8n-nodes-base.code', 2, [1860, 260], { mode: 'runOnceForEachItem', jsCode: `return {json:{...$json,airtableFilePayload:{records:[{fields:{'Identifiant fichier':$json.fileKey,'Nom fichier':$json.originalName,'Mail':[$json.mailRecordId],'Mail Gmail ID':$json.gmailId,'Statut upload':'A_UPLOADER','Détail erreur':''}}]}}};` }));
mainNodes.push(node('Créer fiche Fichier', 'n8n-nodes-base.httpRequest', 4.4, [2040, 260], httpJson('POST', '=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_FILES_TABLE_ID}}', `={{ JSON.stringify($json.airtableFilePayload) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Restaurer binaire', 'n8n-nodes-base.code', 2, [2220, 260], { mode: 'runOnceForEachItem', jsCode: `const a=$('Préparer pièces jointes').item; return {json:{...a.json,fileRecordId:$json.records[0].id},binary:a.binary};` }));
mainNodes.push(node('Uploader vers Drive', 'n8n-nodes-base.googleDrive', 3, [2460, 260], { authentication: 'oAuth2', resource: 'file', operation: 'upload', inputDataFieldName: 'data', name: '={{ $json.archivedName }}', driveId: { __rl: true, mode: 'list', value: 'My Drive' }, folderId: { __rl: true, mode: 'id', value: '={{ $json.clientFolderId }}' }, options: {} }, { credentials: driveAuth, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000, onError: 'continueRegularOutput' }));
mainNodes.push(node('Upload réussi ?', 'n8n-nodes-base.if', 2.2, [2700, 260], { conditions: { options: { version: 2, caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ leftValue: '={{ Boolean($json.id) }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] } }));
mainNodes.push(node('Fichier uploadé', 'n8n-nodes-base.httpRequest', 4.4, [2940, 180], httpJson('PATCH', "=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_FILES_TABLE_ID}}/{{$('Restaurer binaire').item.json.fileRecordId}}", `={{ JSON.stringify({fields:{'Statut upload':'UPLOADE','URL Drive':$json.webViewLink||('https://drive.google.com/file/d/'+$json.id+'/view'),'Détail erreur':''}}) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Fichier en erreur', 'n8n-nodes-base.httpRequest', 4.4, [2940, 340], httpJson('PATCH', "=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_FILES_TABLE_ID}}/{{$('Restaurer binaire').item.json.fileRecordId}}", `={{ JSON.stringify({fields:{'Statut upload':'ERREUR','Détail erreur':String($json.error?.message||$json.message||'Échec upload Google Drive').slice(0,900)}}) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Lister fichiers du mail', 'n8n-nodes-base.httpRequest', 4.4, [3180, 260], httpGet('=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_FILES_TABLE_ID}}', [
  { name: 'filterByFormula', value: `={{ "{Mail Gmail ID}='" + $('Restaurer binaire').item.json.gmailId.replace(/'/g, "\\\\'") + "'" }}` },
]), { credentials: airtableAuth }));
mainNodes.push(node('Calculer statut mail', 'n8n-nodes-base.code', 2, [3420, 260], { mode: 'runOnceForEachItem', jsCode: `const rows=$json.records||[]; const statuses=rows.map(r=>r.fields['Statut upload']); const pending=statuses.filter(s=>s==='A_UPLOADER').length; const ok=statuses.filter(s=>s==='UPLOADE').length; const errors=statuses.filter(s=>s==='ERREUR').length; const status=pending?'EN_COURS':errors?(ok?'PARTIEL':'ERREUR'):'TERMINE'; const a=$('Restaurer binaire').item.json; return {json:{gmailId:a.gmailId,mailRecordId:a.mailRecordId,status,isFinal:pending===0,detail:errors?errors+' fichier(s) en erreur':''}};` }));
mainNodes.push(node('Mettre à jour statut mail', 'n8n-nodes-base.httpRequest', 4.4, [3660, 260], httpJson('PATCH', '=https://api.airtable.com/v0/{{$env.AIRTABLE_BASE_ID}}/{{$env.AIRTABLE_MAILS_TABLE_ID}}/{{$json.mailRecordId}}', `={{ JSON.stringify({fields:{Statut:$json.status,'Détail erreur':$json.detail}}) }}`), { credentials: airtableAuth }));
mainNodes.push(node('Libeller Gmail', 'n8n-nodes-base.httpRequest', 4.4, [3900, 120], httpJson('POST', "=https://gmail.googleapis.com/gmail/v1/users/me/messages/{{ $('Calculer statut mail').isExecuted ? $('Calculer statut mail').item.json.gmailId : $('Préparer pièces jointes').item.json.gmailId }}/modify", `={{ JSON.stringify({addLabelIds:[($('Calculer statut mail').isExecuted && ['PARTIEL','ERREUR'].includes($('Calculer statut mail').item.json.status))?$env.GMAIL_LABEL_ERROR_ID:$env.GMAIL_LABEL_DONE_ID],removeLabelIds:['UNREAD']}) }}`, 'gmailOAuth2'), { credentials: gmailAuth }));

const c = {};
connect(c,'Gmail toutes les 5 minutes','Normaliser email');
connect(c,'Normaliser email','Chercher mail Airtable'); connect(c,'Chercher mail Airtable','Mail déjà connu ?');
connect(c,'Mail déjà connu ?','Ignorer doublon',0); connect(c,'Mail déjà connu ?','Chercher client Airtable',1);
connect(c,'Chercher client Airtable','Client trouvé ?'); connect(c,'Client trouvé ?','Contexte client existant',0); connect(c,'Client trouvé ?','Chercher dossier Drive',1);
connect(c,'Chercher dossier Drive','Dossier trouvé ?'); connect(c,'Dossier trouvé ?','Contexte dossier existant',0); connect(c,'Dossier trouvé ?','Créer dossier Drive',1);
connect(c,'Créer dossier Drive','Contexte dossier créé'); connect(c,'Contexte dossier existant','Préparer requête Client'); connect(c,'Contexte dossier créé','Préparer requête Client'); connect(c,'Préparer requête Client','Créer client Airtable'); connect(c,'Créer client Airtable','Contexte client créé');
connect(c,'Contexte client existant','Préparer requête Mail'); connect(c,'Contexte client créé','Préparer requête Mail'); connect(c,'Préparer requête Mail','Créer mail Airtable'); connect(c,'Créer mail Airtable','Préparer pièces jointes');
connect(c,'Préparer pièces jointes','Avec pièce jointe ?'); connect(c,'Avec pièce jointe ?','Préparer requête Fichier',0); connect(c,'Avec pièce jointe ?','Terminer mail sans PJ',1); connect(c,'Terminer mail sans PJ','Libeller Gmail');
connect(c,'Préparer requête Fichier','Créer fiche Fichier');
connect(c,'Créer fiche Fichier','Restaurer binaire'); connect(c,'Restaurer binaire','Uploader vers Drive'); connect(c,'Uploader vers Drive','Upload réussi ?'); connect(c,'Upload réussi ?','Fichier uploadé',0); connect(c,'Upload réussi ?','Fichier en erreur',1); connect(c,'Fichier uploadé','Lister fichiers du mail'); connect(c,'Fichier en erreur','Lister fichiers du mail'); connect(c,'Lister fichiers du mail','Calculer statut mail'); connect(c,'Calculer statut mail','Mettre à jour statut mail'); connect(c,'Mettre à jour statut mail','Libeller Gmail');

const main = { name:'WF01_Ingestion_Gmail_GED', nodes:mainNodes, connections:c, active:false, settings:{ executionOrder:'v1', timezone:'Europe/Paris', saveDataErrorExecution:'all', saveDataSuccessExecution:'all', saveManualExecutions:true }, versionId:id(), meta:{ templateCredsSetupCompleted:false }, pinData:{}, tags:[] };

fs.writeFileSync(path.join(out,'WF01_Ingestion_Gmail_GED.json'),JSON.stringify(main,null,2)+'\n');
console.log('Generated workflow:', main.nodes.length);
