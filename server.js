import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Save ItemName file
app.post('/api/save/itemname', async (req, res) => {
  try {
    const { content } = req.body;
    const filePath = path.join(__dirname, './public/txt/ItemName_Classic-eu.txt');
    
    // Create backup
    const backupPath = path.join(__dirname, './public/txt/ItemName_Classic-eu.txt.backup');
    try {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, originalContent, 'utf-8');
    } catch (err) {
      console.log('No existing file to backup');
    }
    
    // Save new content
    await fs.writeFile(filePath, content, 'utf-8');
    
    res.json({ success: true, message: 'ItemName file saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save all files at once
app.post('/api/save/all', async (req, res) => {
  try {
    const { itemName, weapon, armor, etc } = req.body;
    const results = [];
    
    if (itemName) {
      const filePath = path.join(__dirname, './public/txt/ItemName_Classic-eu.txt');
      const backupPath = path.join(__dirname, './public/txt/ItemName_Classic-eu.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing ItemName file to backup');
      }
      await fs.writeFile(filePath, itemName, 'utf-8');
      results.push('ItemName');
    }
    
    if (weapon) {
      const filePath = path.join(__dirname, './public/txt/Weapongrp_Classic.txt');
      const backupPath = path.join(__dirname, './public/txt/Weapongrp_Classic.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing Weapon file to backup');
      }
      await fs.writeFile(filePath, weapon, 'utf-8');
      results.push('Weapongrp');
    }
    
    if (armor) {
      const filePath = path.join(__dirname, './public/txt/Armorgrp_Classic.txt');
      const backupPath = path.join(__dirname, './public/txt/Armorgrp_Classic.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing Armor file to backup');
      }
      await fs.writeFile(filePath, armor, 'utf-8');
      results.push('Armorgrp');
    }
    
    if (etc) {
      const filePath = path.join(__dirname, './public/txt/EtcItemgrp_Classic.txt');
      const backupPath = path.join(__dirname, './public/txt/EtcItemgrp_Classic.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing Etc file to backup');
      }
      await fs.writeFile(filePath, etc, 'utf-8');
      results.push('EtcItemgrp');
    }
    
    res.json({ success: true, message: `Files saved: ${results.join(', ')}` });
  } catch (error) {
    console.error('Error saving files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save Weapon file
app.post('/api/save/weapon', async (req, res) => {
  try {
    const { content } = req.body;
    const filePath = path.join(__dirname, './public/txt/Weapongrp_Classic.txt');
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, message: 'Weapon file saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save Armor file
app.post('/api/save/armor', async (req, res) => {
  try {
    const { content } = req.body;
    const filePath = path.join(__dirname, './public/txt/Armorgrp_Classic.txt');
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, message: 'Armor file saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save Etc file
app.post('/api/save/etc', async (req, res) => {
  try {
    const { content } = req.body;
    const filePath = path.join(__dirname, './public/txt/EtcItemgrp_Classic.txt');
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, message: 'Etc file saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete skill from skill files
app.delete('/api/delete/skill', async (req, res) => {
  try {
    const { skillId, skillLevel, skillSublevel } = req.body;
    
    if (!skillId) {
      return res.status(400).json({ success: false, message: 'Skill ID is required' });
    }

    const txtFiles = [
      { path: path.join(__dirname, './public/txt/SkillName_Classic-eu.txt'), type: 'skillname' },
      { path: path.join(__dirname, './public/txt/Skillgrp_Classic.txt'), type: 'skillgrp' }
    ];

    let deletedFrom = [];
    let errors = [];

    for (const file of txtFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        let modified = false;
        let newContent = '';

        const blocks = content.split('skill_end');
        for (const block of blocks) {
          if (block.includes('skill_begin')) {
            // Check if this block contains the skill
            const idMatch = block.match(/skill_id=(\d+)/);
            const levelMatch = block.match(/skill_level=(\d+)/);
            const sublevelMatch = block.match(/skill_sublevel=(\d+)/);
            
            const matchesId = idMatch && idMatch[1] === skillId;
            const matchesLevel = !skillLevel || (levelMatch && levelMatch[1] === skillLevel);
            const matchesSublevel = !skillSublevel || (sublevelMatch && sublevelMatch[1] === skillSublevel);
            
            if (matchesId && matchesLevel && matchesSublevel) {
              modified = true;
              continue; // Skip this block (delete it)
            }
          }
          newContent += block;
          if (block.trim()) {
            newContent += 'skill_end';
          }
        }

        if (modified) {
          // Create backup before modifying
          const backupPath = file.path + '.backup';
          try {
            await fs.writeFile(backupPath, content, 'utf-8');
          } catch (err) {
            console.log('Could not create backup for', file.path);
          }

          // Write the modified content
          await fs.writeFile(file.path, newContent, 'utf-8');
          deletedFrom.push(file.type);
        }
      } catch (err) {
        errors.push(`${file.type}: ${err.message}`);
      }
    }

    if (deletedFrom.length > 0) {
      res.json({ 
        success: true, 
        message: `Skill ${skillId} deleted from: ${deletedFrom.join(', ')}`,
        deletedFrom,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      res.json({ 
        success: false, 
        message: `Skill ${skillId} not found in any files`,
        errors: errors.length > 0 ? errors : undefined
      });
    }
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save skill files
app.post('/api/save/skills', async (req, res) => {
  try {
    const { skillName, skillGrp } = req.body;
    const results = [];
    
    if (skillName) {
      const filePath = path.join(__dirname, './public/txt/SkillName_Classic-eu.txt');
      const backupPath = path.join(__dirname, './public/txt/SkillName_Classic-eu.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing SkillName file to backup');
      }
      await fs.writeFile(filePath, skillName, 'utf-8');
      results.push('SkillName');
    }
    
    if (skillGrp) {
      const filePath = path.join(__dirname, './public/txt/Skillgrp_Classic.txt');
      const backupPath = path.join(__dirname, './public/txt/Skillgrp_Classic.txt.backup');
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (err) {
        console.log('No existing Skillgrp file to backup');
      }
      await fs.writeFile(filePath, skillGrp, 'utf-8');
      results.push('Skillgrp');
    }
    
    res.json({ success: true, message: `Files saved: ${results.join(', ')}` });
  } catch (error) {
    console.error('Error saving skill files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete item from all files
app.delete('/api/delete/item', async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    const txtFiles = [
      { path: path.join(__dirname, './public/txt/ItemName_Classic-eu.txt'), type: 'itemname' },
      { path: path.join(__dirname, './public/txt/Weapongrp_Classic.txt'), type: 'weapon' },
      { path: path.join(__dirname, './public/txt/Armorgrp_Classic.txt'), type: 'armor' },
      { path: path.join(__dirname, './public/txt/EtcItemgrp_Classic.txt'), type: 'etc' }
    ];

    let deletedFrom = [];
    let errors = [];

    for (const file of txtFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        let modified = false;
        let newContent = '';

        if (file.type === 'itemname') {
          // Parse ItemName file
          const blocks = content.split('item_name_end');
          for (const block of blocks) {
            if (block.includes('item_name_begin')) {
              // Check if this block contains the item ID
              const idMatch = block.match(/id=(\d+)/);
              if (idMatch && idMatch[1] === itemId) {
                modified = true;
                continue; // Skip this block (delete it)
              }
            }
            newContent += block;
            if (block.trim()) {
              newContent += 'item_name_end';
            }
          }
        } else {
          // Parse Weapon/Armor/Etc files
          const blocks = content.split('item_end');
          for (const block of blocks) {
            if (block.includes('item_begin')) {
              // Check if this block contains the object_id
              const idMatch = block.match(/object_id=(\d+)/);
              if (idMatch && idMatch[1] === itemId) {
                modified = true;
                continue; // Skip this block (delete it)
              }
            }
            newContent += block;
            if (block.trim()) {
              newContent += 'item_end';
            }
          }
        }

        if (modified) {
          // Create backup before modifying
          const backupPath = file.path + '.backup';
          try {
            await fs.writeFile(backupPath, content, 'utf-8');
          } catch (err) {
            console.log('Could not create backup for', file.path);
          }

          // Write the modified content
          await fs.writeFile(file.path, newContent, 'utf-8');
          deletedFrom.push(file.type);
        }
      } catch (err) {
        errors.push(`${file.type}: ${err.message}`);
      }
    }

    if (deletedFrom.length > 0) {
      res.json({ 
        success: true, 
        message: `Item ${itemId} deleted from: ${deletedFrom.join(', ')}`,
        deletedFrom,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      res.json({ 
        success: false, 
        message: `Item ${itemId} not found in any files`,
        errors: errors.length > 0 ? errors : undefined
      });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Tools API - Generate SetItemGrp
app.post('/api/tools/generate-setitemgrp', async (req, res) => {
  const logs = [];
  
  const addLog = (message, type = 'info') => {
    logs.push({ message, type });
    console.log(message);
  };
  
  try {
    addLog('Starting SetItemGrp generation...', 'step');
    
    const armorSetsPath = path.join(__dirname, './xml/armor_sets.xml');
    const outputPath = path.join(__dirname, './public/txt/SetItemGrp_Classic-eu.txt');
    
    // Helper functions
    const readXMLFile = (filePath) => fsSync.readFileSync(filePath, 'utf-8');
    
    const parseXML = async (xmlContent) => {
      const parser = new xml2js.Parser({ explicitArray: false });
      return parser.parseStringPromise(xmlContent);
    };
    
    const getSkillFilePath = (skillId) => {
      const id = parseInt(skillId);
      const lowerBound = Math.floor(id / 100) * 100;
      const upperBound = lowerBound + 99;
      return path.join(__dirname, `../xml/stats/skills/${lowerBound}-${upperBound}.xml`);
    };
    
    const parseSkillEffects = (forTag) => {
      const effects = [];
      if (!forTag) return effects;
      
      const operations = Array.isArray(forTag) ? forTag : [forTag];
      operations.forEach(op => {
        const effectTags = ['add', 'mul', 'sub', 'div', 'set'];
        effectTags.forEach(tag => {
          if (op[tag]) {
            const items = Array.isArray(op[tag]) ? op[tag] : [op[tag]];
            items.forEach(item => {
              if (item.$ && item.$.stat) {
                effects.push({
                  operation: tag,
                  stat: item.$.stat,
                  value: item.$.val,
                  order: item.$.order
                });
              }
            });
          }
        });
      });
      return effects;
    };
    
    const effectsToDescription = (effects) => {
      const descriptions = [];
      const statMap = {
        // Hp/Cp/Mp
        'maxHp': 'Max HP', 'maxMp': 'Max MP', 'maxCp': 'Max CP',
        
        // Regeneration
        'regHp': 'HP Recovery Rate', 'regMp': 'MP Recovery Rate', 'regCp': 'CP Recovery Rate',
        
        // Limits
        'hpLimit': 'HP Limit', 'mpLimit': 'MP Limit', 'cpLimit': 'CP Limit',
        
        // Speed
        'runSpd': 'Speed', 'moveSpeed': 'Speed',
        
        // Attack and Defense
        'pDef': 'P. Def.', 'mDef': 'M. Def.', 'pAtk': 'P. Atk.', 'mAtk': 'M. Atk.',
        'pAtkSpd': 'Atk. Spd.', 'mAtkSpd': 'Casting Spd.',
        
        // Skill Cooldowns
        'mReuse': 'Magic Reuse', 'pReuse': 'Physical Reuse', 'musicReuse': 'Music Reuse',
        'atkReuse': 'Attack Reuse', 'atkBaseSpeed': 'Base Attack Speed',
        
        // Critical Hits
        'cAtk': 'Critical Damage', 'cAtkStatic': 'Critical Damage',
        'rEvas': 'Evasion', 'evasionRate': 'Evasion', 'accCombat': 'Accuracy',
        'baseCrit': 'Critical Rate', 'rCrit': 'Critical Rate',
        'mCritRate': 'Magic Critical Rate', 'mCritDamage': 'Magic Critical Damage',
        'mCritDamageResist': 'Magic Critical Damage Resistance',
        
        // Damage
        'physDamage': 'Physical Damage', 'magicDamage': 'Magic Damage',
        
        // Shield and Interrupt
        'concentration': 'Magic Cancel Rate', 'sDef': 'Shield Defense',
        'rShld': 'Shield Defense Rate', 'shldAngle': 'Shield Block Angle',
        'shieldDef': 'Shield Defense', 'shieldDefRate': 'Shield Defense Rate',
        
        // Attack Range and Angle
        'pAtkRange': 'Physical Attack Range', 'mAtkRange': 'Magic Attack Range',
        'poleAngle': 'Pole Attack Angle', 'poleTargetCount': 'Pole Target Count',
        
        // Base Stats
        'STR': 'STR', 'CON': 'CON', 'DEX': 'DEX', 'INT': 'INT', 'WIT': 'WIT', 'MEN': 'MEN',
        
        // Miscellaneous
        'breath': 'Breath Gauge', 'breathBonus': 'Breath Gauge',
        'fall': 'Fall Damage Resistance', 'expLost': 'EXP Loss Reduction',
        'maxNoPenaltyLoad': 'Weight Limit', 'weightLimit': 'Weight Limit',
        'hpEff': 'Heal Amount Received', 'mpEff': 'MP Recovery Amount',
        
        // Resistances
        'bleedResist': 'Resistance to bleed attack', 'poisonResist': 'Resistance to poison attack',
        'stunResist': 'Resistance to stun attack', 'rootResist': 'Resistance to root attack',
        'mentalResist': 'Mental Resistance', 'sleepResist': 'Resistance to sleep attack',
        'paralyzeResist': 'Resistance to paralysis attack', 'cancelResist': 'Buff Cancel Resistance',
        'debuffResist': 'Debuff Resistance', 'magicResist': 'Magic Resistance',
        'confusionResist': 'Confusion Resistance',
        
        // Effect Power
        'bleedPower': 'Bleed Power', 'poisonPower': 'Poison Power',
        'stunPower': 'Stun Power', 'rootPower': 'Root Power',
        'mentalPower': 'Mental Power', 'sleepPower': 'Sleep Power',
        'paralyzePower': 'Paralyze Power', 'cancelPower': 'Cancel Power',
        'debuffPower': 'Debuff Power', 'magicPower': 'Magic Power',
        
        // Crit and Vulnerabilities
        'blowRate': 'Fatal Blow Chance', 'SkillCritChanceMod': 'Skill Critical Chance',
        'deathVuln': 'Death Vulnerability', 'critDamRcpt': 'Critical Damage Vulnerability',
        'critChanceRcpt': 'Critical Chance Vulnerability',
        
        // Elemental Defense
        'defenceFire': 'Fire Defense', 'defenceWater': 'Water Defense',
        'defenceWind': 'Wind Defense', 'defenceEarth': 'Earth Defense',
        'defenceHoly': 'Holy Defense', 'defenceUnholy': 'Unholy Defense',
        
        // Elemental Attack
        'attackFire': 'Fire Attack', 'attackWater': 'Water Attack',
        'attackWind': 'Wind Attack', 'attackEarth': 'Earth Attack',
        'attackHoly': 'Holy Attack', 'attackUnholy': 'Unholy Attack',
        
        // Weapon Vulnerability
        'swordWpnVuln': 'Sword Vulnerability', 'dualWpnVuln': 'Dual Sword Vulnerability',
        'bluntWpnVuln': 'Blunt Weapon Vulnerability', 'daggerWpnVuln': 'Dagger Vulnerability',
        'bowWpnVuln': 'Bow Vulnerability', 'crossbowWpnVuln': 'Crossbow Vulnerability',
        'poleWpnVuln': 'Pole Vulnerability', 'fistWpnVuln': 'Fist Vulnerability',
        
        // Damage Absorption and Transfer
        'absorbDam': 'Damage Absorption', 'absorbDamToMp': 'Damage to MP Absorption',
        'absorbDamToMpChance': 'Damage to MP Chance', 'transferPetDam': 'Damage Transfer to Pet',
        'transferToEffectorDam': 'Damage Transfer to Buffer',
        
        // Damage Reflection
        'reflectAndBlockDam': 'Physical Damage Reflection',
        'reflectAndBlockPSkillDam': 'Physical Skill Reflection',
        'reflectAndBlockMSkillDam': 'Magic Skill Reflection',
        'absorbDamageValue': 'Damage Absorption Value',
        'reflectDam': 'Damage Reflection',
        'reflectPSkillDam': 'Physical Skill Damage Reflection',
        'reflectMSkillDam': 'Magic Skill Damage Reflection',
        
        // Skill and Debuff Reflection
        'reflectPhysicSkill': 'Physical Skill Reflection',
        'reflectMagicSkill': 'Magic Skill Reflection',
        'reflectPhysicDebuff': 'Physical Debuff Reflection',
        'reflectMagicDebuff': 'Magic Debuff Reflection',
        
        // Evasion and Counter
        'pSkillEvasion': 'Physical Skill Evasion', 'counterAttack': 'Counter Attack',
        
        // PvP Bonuses
        'skillPower': 'Skill Power', 'pvpPhysDmgBonus': 'PvP Physical Damage',
        'pvpPhysSkillDmgBonus': 'PvP Physical Skill Damage',
        'pvpMagicSkillDmgBonus': 'PvP Magic Skill Damage',
        'pvpPhysDefenceBonus': 'PvP Physical Defense',
        'pvpPhysSkillDefenceBonus': 'PvP Physical Skill Defense',
        'pvpMagicSkillDefenceBonus': 'PvP Magic Skill Defense',
        
        // PvE Bonuses
        'pvePhysDmgBonus': 'PvE Physical Damage',
        'pvePhysSkillDmgBonus': 'PvE Physical Skill Damage',
        'pveMagicSkillDmgBonus': 'PvE Magic Skill Damage',
        'pvePhysDefenceBonus': 'PvE Physical Defense',
        'pvePhysSkillDefenceBonus': 'PvE Physical Skill Defense',
        'pveMagicSkillDefenceBonus': 'PvE Magic Skill Defense',
        
        // Other
        'mpConsumeRate': 'MP Consumption', 'pDamBow': 'P. Atk. when bow equipped'
      };
      
      effects.forEach(effect => {
        const statName = statMap[effect.stat] || effect.stat;
        const value = parseFloat(effect.value);
        
        if (effect.operation === 'mul') {
          const percentage = ((value - 1) * 100).toFixed(2).replace('.00', '');
          if (value > 1) {
            descriptions.push(`${statName} +${percentage}%`);
          } else if (value < 1) {
            descriptions.push(`${statName} ${percentage}%`);
          }
        } else if (effect.operation === 'add') {
          if (value > 0) {
            descriptions.push(`${statName} +${Math.round(value)}`);
          } else {
            descriptions.push(`${statName} ${Math.round(value)}`);
          }
        } else if (effect.operation === 'sub') {
          descriptions.push(`${statName} -${Math.round(Math.abs(value))}`);
        }
      });
      
      return descriptions.join(', ');
    };
    
    const getSkillInfo = async (skillId) => {
      try {
        const filePath = getSkillFilePath(skillId);
        if (!fsSync.existsSync(filePath)) return null;
        
        const xmlContent = readXMLFile(filePath);
        const parsed = await parseXML(xmlContent);
        if (!parsed.list || !parsed.list.skill) return null;
        
        const skills = Array.isArray(parsed.list.skill) ? parsed.list.skill : [parsed.list.skill];
        const skill = skills.find(s => s.$.id === String(skillId));
        if (!skill) return null;
        
        const effects = parseSkillEffects(skill.for);
        const description = effectsToDescription(effects);
        
        return { id: skillId, name: skill.$.name || '', description: description || 'No set effect' };
      } catch (error) {
        return null;
      }
    };
    
    const formatItems = (items) => {
      const parts = [];
      const order = ['chest', 'legs', 'head', 'gloves', 'feet'];
      
      order.forEach(slot => {
        if (items[slot]) {
          parts.push(items[slot]);
        }
      });
      
      return parts;
    };
    
    const generateSetEntry = async (set, index) => {
      const essentialItems = formatItems(set.items);
      const essentialDesc = [];
      
      // Process main skills
      if (set.skills) {
        const skillParts = set.skills.split(';');
        for (const skillPart of skillParts) {
          const [skillId] = skillPart.split('-');
          const skillInfo = await getSkillInfo(skillId);
          if (skillInfo) {
            essentialDesc.push(skillInfo.description);
          }
        }
      }
      
      // Fill with "No set effect" if needed
      while (essentialDesc.length < essentialItems.length - 1) {
        essentialDesc.unshift('[No set effect]');
      }
      if (essentialDesc.length > 0 && !essentialDesc[0].startsWith('[')) {
        essentialDesc[essentialDesc.length - 1] = `[${essentialDesc[essentialDesc.length - 1]}]`;
      }
      essentialDesc.forEach((desc, i) => {
        if (!desc.startsWith('[')) {
          essentialDesc[i] = `[${desc}]`;
        }
      });
      
      // Format essential items
      const formattedEssential = essentialItems.map(item => `{${item}}`).join(';');
      const formattedDesc = essentialDesc.join(';');
      
      // Process shield
      let additionalItems = '';
      let additionalDesc = '';
      if (set.items.shield) {
        additionalItems = `{${set.items.shield}}`;
        
        if (set.shield_skills) {
          const skillParts = set.shield_skills.split(';');
          for (const skillPart of skillParts) {
            const [skillId] = skillPart.split('-');
            const skillInfo = await getSkillInfo(skillId);
            if (skillInfo) {
              additionalDesc = `[${skillInfo.description}]`;
            }
          }
        }
      }
      
      // Build output line
      let output = `setitem_group_begin\tnum=${index}`;
      output += `\tessential_setitem_id={${formattedEssential}}`;
      output += `\tessential_setitem_desc={${formattedDesc}}`;
      output += `\tadditional_setitem_id={${additionalItems}}`;
      output += `\tadditional_setitem_desc={${additionalDesc}}`;
      output += `\tunk1=0\tunk2=0\tenchant_setitem_condition={}\tsetitem_group_end`;
      
      return output;
    };
    
    // Parse armor sets
    addLog('Reading armor_sets.xml', 'step');
    const xmlContent = readXMLFile(armorSetsPath);
    const parsed = await parseXML(xmlContent);
    
    if (!parsed.list || !parsed.list.set) {
      throw new Error('No sets found in armor_sets.xml');
    }
    
    const setArray = Array.isArray(parsed.list.set) ? parsed.list.set : [parsed.list.set];
    addLog(`Found ${setArray.length} armor sets`, 'success');
    
    addLog('Processing sets and extracting skill effects', 'step');
    
    // Generate entries
    const lines = [];
    for (let i = 0; i < setArray.length; i++) {
      const set = setArray[i];
      const setData = {
        id: set.$.id,
        items: {
          chest: set.$.chest || null,
          legs: set.$.legs || null,
          head: set.$.head || null,
          gloves: set.$.gloves || null,
          feet: set.$.feet || null,
          shield: set.$.shield || null
        },
        skills: set.$.skills || null,
        shield_skills: set.$.shield_skills || null,
        enchant6skills: set.$.enchant6skills || null
      };
      
      const line = await generateSetEntry(setData, i);
      lines.push(line);
    }
    
    addLog('Writing output file', 'step');
    await fs.writeFile(outputPath, lines.join('\n') + '\n', 'utf-8');
    
    addLog(`Generated ${lines.length} set entries`, 'success');
    addLog('SetItemGrp_Classic-eu.txt generated successfully!', 'success');
    
    res.json({ success: true, logs });
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
    res.status(500).json({ success: false, message: error.message, logs });
  }
});

// Tools API - Update ItemName name_class
app.post('/api/tools/update-name-class', async (req, res) => {
  const logs = [];
  
  const addLog = (message, type = 'info') => {
    logs.push({ message, type });
    console.log(message);
  };
  
  try {
    addLog('Starting name_class update...', 'step');
    
    const setItemGrpPath = path.join(__dirname, './public/txt/SetItemGrp_Classic-eu.txt');
    const itemNamePath = path.join(__dirname, './public/txt/ItemName_Classic-eu.txt');
    
    // Parse SetItemGrp
    addLog('Reading SetItemGrp_Classic-eu.txt', 'step');
    const setContent = await fs.readFile(setItemGrpPath, 'utf-8');
    const setLines = setContent.split('\n').filter(line => line.trim());
    
    const setMappings = [];
    setLines.forEach(line => {
      const numMatch = line.match(/num=(\d+)/);
      const itemIdMatch = line.match(/essential_setitem_id=\{\{([^}]+)\}/);
      
      if (numMatch && itemIdMatch) {
        const setNum = numMatch[1];
        const itemsStr = itemIdMatch[1];
        const firstGroup = itemsStr.split('};')[0];
        const chestIds = firstGroup.split(';').map(id => id.trim());
        
        chestIds.forEach(chestId => {
          if (chestId && /^\d+$/.test(chestId)) {
            setMappings.push({
              setNum: parseInt(setNum),
              chestId: parseInt(chestId)
            });
          }
        });
      }
    });
    
    addLog(`Found ${setMappings.length} chest pieces across ${setLines.length} armor sets`, 'success');
    
    // Update ItemName
    addLog('Reading ItemName_Classic-eu.txt', 'step');
    const itemContent = await fs.readFile(itemNamePath, 'utf-8');
    const itemLines = itemContent.split('\n');
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    const updatedLines = itemLines.map(line => {
      if (!line.includes('item_name_begin')) return line;
      
      const idMatch = line.match(/\bid=(\d+)\b/);
      if (!idMatch) return line;
      
      const itemId = parseInt(idMatch[1]);
      const mapping = setMappings.find(m => m.chestId === itemId);
      
      if (mapping) {
        const currentClassMatch = line.match(/\bname_class=(-?\d+)\b/);
        if (currentClassMatch) {
          const currentClass = parseInt(currentClassMatch[1]);
          
          if (currentClass === mapping.setNum) {
            skippedCount++;
            return line;
          }
          
          const updatedLine = line.replace(/\bname_class=-?\d+\b/, `name_class=${mapping.setNum}`);
          addLog(`Updated item ${itemId}: name_class ${currentClass} → ${mapping.setNum}`, 'info');
          updatedCount++;
          return updatedLine;
        }
      }
      
      return line;
    });
    
    addLog('Writing updated ItemName_Classic-eu.txt', 'step');
    await fs.writeFile(itemNamePath, updatedLines.join('\n'), 'utf-8');
    
    addLog(`${updatedCount} items updated, ${skippedCount} items already correct`, 'success');
    addLog('ItemName_Classic-eu.txt updated successfully!', 'success');
    
    res.json({ success: true, logs });
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
    res.status(500).json({ success: false, message: error.message, logs });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
