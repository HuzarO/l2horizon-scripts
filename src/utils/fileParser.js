/**
 * Parse a single item block from text content
 */
function parseItemBlock(block, type) {
  const item = {};
  // Split by tabs and newlines to get all key=value pairs
  const parts = block.trim().split(/[\t\n]+/).filter(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('=') && !part.includes('item_begin') && !part.includes('item_end')) {
      const equalIndex = part.indexOf('=');
      const key = part.substring(0, equalIndex).trim();
      const value = part.substring(equalIndex + 1).trim();
      item[key] = value;
    }
  }
  
  item._type = type;
  return item;
}

/**
 * Parse ItemName file
 */
export function parseItemNameFile(content) {
  const items = [];
  const blocks = content.split('item_name_end').filter(b => b.trim());
  
  for (const block of blocks) {
    if (block.includes('item_name_begin')) {
      const item = {};
      // Split by tabs to get all fields
      const parts = block.split(/[\t\n]+/).filter(p => p.trim());
      
      for (const part of parts) {
        if (part.includes('=') && !part.includes('item_name_begin')) {
          const equalIndex = part.indexOf('=');
          const key = part.substring(0, equalIndex).trim();
          let value = part.substring(equalIndex + 1).trim();
          
          item[key] = value;
        }
      }
      
      if (item.id) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Parse Weapon/Armor/Etc item files
 */
export function parseItemGroupFile(content, type) {
  const items = [];
  const blocks = content.split('item_end').filter(b => b.trim());
  
  for (const block of blocks) {
    if (block.includes('item_begin')) {
      const item = parseItemBlock(block, type);
      if (item.object_id) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Serialize ItemName data back to file format
 */
export function serializeItemNameFile(items) {
  let content = '';
  
  for (const item of items) {
    const parts = ['item_name_begin'];
    
    const keys = ['id', 'name', 'additionalname', 'description', 'popup', 'default_action', 
                  'use_order', 'name_class', 'color', 'Tooltip_Texture', 'is_trade', 
                  'is_drop', 'is_destruct', 'is_private_store', 'keep_type', 'is_npctrade', 
                  'is_commission_store'];
    
    for (const key of keys) {
      if (item[key] !== undefined) {
        parts.push(`${key}=${item[key]}`);
      }
    }
    
    parts.push('item_name_end');
    content += parts.join('\t') + '\n';
  }
  
  return content;
}

/**
 * Serialize Item Group data (weapon/armor/etc) back to file format
 */
export function serializeItemGroupFile(items) {
  let content = '';
  
  for (const item of items) {
    const parts = ['item_begin'];
    
    // Get all keys except _type
    const keys = Object.keys(item).filter(k => k !== '_type');
    
    for (const key of keys) {
      if (item[key] !== undefined) {
        parts.push(`${key}=${item[key]}`);
      }
    }
    
    parts.push('item_end');
    content += parts.join('\t') + '\n';
  }
  
  return content;
}

/**
 * Extract icon path from item data
 */
export function extractIconPath(iconData) {
  if (!iconData) return null;
  
  // Parse format: {[icon.weapon_small_sword_i00];[None];[None];[None];[None]}
  const match = iconData.match(/\[([^\]]+)\]/);
  if (match && match[1] !== 'None') {
    const iconPath = match[1].replace('icon.', '');
    
    // Determine subfolder based on icon prefix
    let subfolder = '';
    if (iconPath.startsWith('weapon_')) {
      subfolder = 'weapon_i/';
    } else if (iconPath.startsWith('armor_')) {
      // Check specific armor types
      if (iconPath.includes('_h_')) subfolder = 'helmet_i/';
      else if (iconPath.includes('_u_')) subfolder = 'upbody_i/';
      else if (iconPath.includes('_l_')) subfolder = 'lowbody_i/';
      else if (iconPath.includes('_g_')) subfolder = 'glove_i/';
      else if (iconPath.includes('_b_')) subfolder = 'boots_i/';
      else subfolder = 'onepiece/';
    } else if (iconPath.startsWith('shield_')) {
      subfolder = 'shield_i/';
    } else if (iconPath.startsWith('accessory_') || iconPath.startsWith('accessary_')) {
      subfolder = 'accessary_i/';
    } else if (iconPath.startsWith('etc_')) {
      subfolder = 'etc_i/';
    } else if (iconPath.startsWith('skill_')) {
      subfolder = 'skill_i/';
    } else {
      // Default to etc_i for unknown types
      subfolder = 'etc_i/';
    }
    
    return subfolder + iconPath;
  }
  
  return null;
}

/**
 * Determine item type from object_id ranges
 */
export function determineItemType(id) {
  const numId = parseInt(id);
  
  // Common ID ranges for L2
  if (numId >= 1 && numId <= 9999) {
    if (numId <= 2999) return 'weapon';
    if (numId <= 6999) return 'armor';
    return 'etc';
  }
  
  if (numId >= 10000) {
    // Time-limited items typically in 10000+ range
    return 'special';
  }
  
  return 'etc';
}

/**
 * Parse SkillName file
 */
export function parseSkillNameFile(content) {
  const skills = [];
  const blocks = content.split('skill_end').filter(b => b.trim());
  
  for (const block of blocks) {
    if (block.includes('skill_begin')) {
      const skill = {};
      const parts = block.split(/[\t\n]+/).filter(p => p.trim());
      
      for (const part of parts) {
        if (part.includes('=') && !part.includes('skill_begin')) {
          const equalIndex = part.indexOf('=');
          const key = part.substring(0, equalIndex).trim();
          let value = part.substring(equalIndex + 1).trim();
          skill[key] = value;
        }
      }
      
      if (skill.skill_id) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}

/**
 * Parse Skillgrp file
 */
export function parseSkillGrpFile(content) {
  const skills = [];
  const blocks = content.split('skill_end').filter(b => b.trim());
  
  for (const block of blocks) {
    if (block.includes('skill_begin')) {
      const skill = {};
      const parts = block.split(/[\t\n]+/).filter(p => p.trim());
      
      for (const part of parts) {
        if (part.includes('=') && !part.includes('skill_begin')) {
          const equalIndex = part.indexOf('=');
          const key = part.substring(0, equalIndex).trim();
          let value = part.substring(equalIndex + 1).trim();
          skill[key] = value;
        }
      }
      
      if (skill.skill_id) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}

/**
 * Serialize SkillName data back to file format
 */
export function serializeSkillNameFile(skills) {
  let content = '';
  
  for (const skill of skills) {
    const parts = ['skill_begin'];
    
    const keys = ['skill_id', 'skill_level', 'skill_sublevel', 'name', 'desc', 
                  'desc_param', 'enchant_name', 'enchant_name_param', 
                  'enchant_desc', 'enchant_desc_param'];
    
    for (const key of keys) {
      if (skill[key] !== undefined) {
        parts.push(`${key}=${skill[key]}`);
      }
    }
    
    parts.push('skill_end');
    content += parts.join('\t') + '\n';
  }
  
  return content;
}

/**
 * Serialize Skillgrp data back to file format
 */
export function serializeSkillGrpFile(skills) {
  let content = '';
  
  for (const skill of skills) {
    const parts = ['skill_begin'];
    
    // Get all keys
    const keys = Object.keys(skill);
    
    for (const key of keys) {
      if (skill[key] !== undefined) {
        parts.push(`${key}=${skill[key]}`);
      }
    }
    
    parts.push('skill_end');
    content += parts.join('\t') + '\n';
  }
  
  return content;
}

/**
 * Extract skill icon path from skill data
 */
export function extractSkillIconPath(iconData) {
  if (!iconData) return null;
  
  // Parse format: [icon.skill0001] or similar
  const match = iconData.match(/\[([^\]]+)\]/);
  if (match && match[1] !== 'None') {
    const iconPath = match[1].replace('icon.', '');
    
    // Check if it's in BranchIcon folder (new icons)
    // BranchIcon icons don't have the icon. prefix typically
    if (iconPath.startsWith('g_') || iconPath.startsWith('s_g_') || 
        iconPath.startsWith('etc_') || iconPath.startsWith('skill_')) {
      return 'BranchIcon/Icon/' + iconPath;
    }
    
    // Default to skill_i folder for old format
    return 'Icon/skill_i/' + iconPath;
  }
  
  return null;
}

/**
 * Parse merchant_buylists.xml file
 */
export function parseMerchantBuylistsXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const tradelists = [];
  const tradelistNodes = xmlDoc.querySelectorAll('tradelist');
  
  tradelistNodes.forEach((tradelistNode) => {
    const tradelist = {
      npc: tradelistNode.getAttribute('npc'),
      shop: tradelistNode.getAttribute('shop'),
      markup: tradelistNode.getAttribute('markup'),
      items: []
    };
    
    const itemNodes = tradelistNode.querySelectorAll('item');
    itemNodes.forEach((itemNode) => {
      tradelist.items.push({
        id: itemNode.getAttribute('id'),
        name: itemNode.getAttribute('name')
      });
    });
    
    tradelists.push(tradelist);
  });
  
  return tradelists;
}

/**
 * Serialize merchant buylists back to XML format
 */
export function serializeMerchantBuylistsXML(tradelists) {
  let xml = "<?xml version='1.0' encoding='utf-8'?>\n<list>\n";
  
  tradelists.forEach((tradelist) => {
    xml += `\n    <tradelist npc="${tradelist.npc}" shop="${tradelist.shop}" markup="${tradelist.markup}" >\n`;
    
    tradelist.items.forEach((item) => {
      xml += `        <item id="${item.id}" name="${item.name}" />\n`;
    });
    
    xml += '    </tradelist>\n';
  });
  
  xml += '\n</list>\n';
  return xml;
}

/**
 * Parse items XML files (from xml/items folder)
 */
export function parseItemsXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const items = [];
  
  // Parse weapons
  const weaponNodes = xmlDoc.querySelectorAll('weapon');
  weaponNodes.forEach((node) => {
    const item = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      type: 'weapon',
      itemType: null,
      icon: null,
      price: null
    };
    
    const setNodes = node.querySelectorAll('set');
    setNodes.forEach((setNode) => {
      const name = setNode.getAttribute('name');
      const value = setNode.getAttribute('value');
      if (name === 'icon') item.icon = value;
      if (name === 'price') item.price = value;
      if (name === 'type') item.itemType = value;
    });
    
    items.push(item);
  });
  
  // Parse armor
  const armorNodes = xmlDoc.querySelectorAll('armor');
  armorNodes.forEach((node) => {
    const item = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      type: 'armor',
      itemType: null,
      icon: null,
      price: null
    };
    
    const setNodes = node.querySelectorAll('set');
    setNodes.forEach((setNode) => {
      const name = setNode.getAttribute('name');
      const value = setNode.getAttribute('value');
      if (name === 'icon') item.icon = value;
      if (name === 'price') item.price = value;
      if (name === 'type') item.itemType = value;
    });
    
    items.push(item);
  });
  
  // Parse etcitems
  const etcNodes = xmlDoc.querySelectorAll('etcitem');
  etcNodes.forEach((node) => {
    const item = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      type: 'etcitem',
      itemType: null,
      icon: null,
      price: null
    };
    
    const setNodes = node.querySelectorAll('set');
    setNodes.forEach((setNode) => {
      const name = setNode.getAttribute('name');
      const value = setNode.getAttribute('value');
      if (name === 'icon') item.icon = value;
      if (name === 'price') item.price = value;
      if (name === 'type') item.itemType = value;
    });
    
    items.push(item);
  });
  
  return items;
}

/**
 * Get icon path from XML item data
 */
export function getItemIconPath(iconValue) {
  if (!iconValue) return null;
  
  const iconPath = iconValue.replace('icon.', '');
  
  // Determine subfolder based on icon prefix
  let subfolder = '';
  if (iconPath.startsWith('weapon_')) {
    subfolder = 'weapon_i/';
  } else if (iconPath.startsWith('armor_')) {
    // Check specific armor types
    if (iconPath.includes('_h_')) subfolder = 'helmet_i/';
    else if (iconPath.includes('_u_')) subfolder = 'upbody_i/';
    else if (iconPath.includes('_l_')) subfolder = 'lowbody_i/';
    else if (iconPath.includes('_g_')) subfolder = 'glove_i/';
    else if (iconPath.includes('_b_')) subfolder = 'boots_i/';
    else subfolder = 'onepiece/';
  } else if (iconPath.startsWith('shield_')) {
    subfolder = 'shield_i/';
  } else if (iconPath.startsWith('accessory_') || iconPath.startsWith('accessary_')) {
    subfolder = 'accessary_i/';
  } else if (iconPath.startsWith('etc_')) {
    subfolder = 'etc_i/';
  } else {
    subfolder = 'etc_i/';
  }
  
  return subfolder + iconPath;
}

/**
 * Parse NPCs XML files (from xml/npc folder)
 */
export function parseNpcsXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const npcs = [];
  
  const npcNodes = xmlDoc.querySelectorAll('npc');
  npcNodes.forEach((node) => {
    const npc = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      title: node.getAttribute('title')
    };
    
    npcs.push(npc);
  });
  
  return npcs;
}
