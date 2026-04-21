const fs = require('fs');
const models = JSON.parse(fs.readFileSync('scratch/openrouter_models.json', 'utf8'));
const ttsModels = models.data.filter(m => m.id.includes('tts') || (m.architecture && m.architecture.modality && m.architecture.modality.includes('audio')));
console.log(ttsModels.map(m => m.id));
