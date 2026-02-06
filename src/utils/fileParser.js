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
  // or {[br_cashtex.item.br_cash_pack_of_soulshot_a_i00];[None];[None];[None];[None]}
  // or {[BranchIcon.Icon.etc_vip_present_i03];[None];[None];[None];[None]}
  const match = iconData.match(/\[([^\]]+)\]/);
  if (match && match[1] !== 'None') {
    let iconPath = match[1];
    let isBrCashtex = false;
    let isBranchIcon = false;
    
    // Check if it's a BranchIcon icon
    if (iconPath.startsWith('BranchIcon.')) {
      // BranchIcon.Icon.etc_vip_present_i03 -> BranchIcon/Icon/etc_vip_present_i03
      // BranchIcon.Panel.filename -> BranchIcon/Panel/filename
      iconPath = iconPath.replace(/\./g, '/');
      isBranchIcon = true;
    } else if (iconPath.startsWith('br_cashtex.item.')) {
      // Check if it's a br_cashtex icon
      iconPath = iconPath.replace('br_cashtex.item.', '');
      isBrCashtex = true;
    } else {
      // Remove 'icon.' prefix for regular icons
      iconPath = iconPath.replace('icon.', '');
    }
    
    // For BranchIcon icons, return the path as-is (already formatted with slashes)
    if (isBranchIcon) {
      return iconPath;
    }
    
    // For br_cashtex icons, return the path without subfolder
    if (isBrCashtex) {
      return iconPath;
    }
    
    // Handle item_ prefixed icons (Item_Normal, Item_CanUse, etc.) - they are in the root Icon folder
    if (iconPath.startsWith('item_')) {
      // Convert to proper case: item_normal06 -> Item_Normal06, item_canuse28 -> Item_CanUse28
      const parts = iconPath.split('_');
      
      // Special case mappings for known compound words
      const specialCases = {
        'canuse': 'CanUse',
        'normal': 'Normal',
        'system': 'System',
        'gragonskill': 'Gragonskill'
      };
      
      const capitalizedParts = parts.map((part, index) => {
        if (index === 0) {
          // First part is always 'item' -> 'Item'
          return 'Item';
        }
        // Check if this part (without numbers) is in special cases
        const textPart = part.replace(/\d+$/, '');
        const numberPart = part.match(/\d+$/) ? part.match(/\d+$/)[0] : '';
        
        if (specialCases[textPart.toLowerCase()]) {
          return specialCases[textPart.toLowerCase()] + numberPart;
        }
        
        // Default: capitalize first letter
        return part.charAt(0).toUpperCase() + part.slice(1);
      });
      
      return capitalizedParts.join('_');
    }
    
    // Determine subfolder based on icon prefix for regular icons
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
    } else if (iconPath.startsWith('skill')) {
      // Handle both skill_ and skill[number] formats
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
    let iconPath = match[1];
    let isBranchIcon = false;
    
    // Check if it's a BranchIcon icon
    if (iconPath.startsWith('BranchIcon.')) {
      // BranchIcon.Icon.filename -> BranchIcon/Icon/filename
      iconPath = iconPath.replace(/\./g, '/');
      return iconPath;
    } else if (iconPath.startsWith('br_cashtex.item.')) {
      // br_cashtex icons
      iconPath = iconPath.replace('br_cashtex.item.', '');
      return iconPath;
    } else {
      // Remove 'icon.' prefix for regular icons
      iconPath = iconPath.replace('icon.', '');
    }
    
    // Handle item_ prefixed icons (Item_Normal, Item_CanUse, etc.)
    if (iconPath.startsWith('item_')) {
      const parts = iconPath.split('_');
      const specialCases = {
        'canuse': 'CanUse',
        'normal': 'Normal',
        'system': 'System',
        'gragonskill': 'Gragonskill'
      };
      
      const capitalizedParts = parts.map((part, index) => {
        if (index === 0) {
          return 'Item';
        }
        const textPart = part.replace(/\d+$/, '');
        const numberPart = part.match(/\d+$/) ? part.match(/\d+$/)[0] : '';
        
        if (specialCases[textPart.toLowerCase()]) {
          return specialCases[textPart.toLowerCase()] + numberPart;
        }
        
        return part.charAt(0).toUpperCase() + part.slice(1);
      });
      
      return capitalizedParts.join('_');
    }
    
    // Determine subfolder based on icon prefix for regular icons
    let subfolder = '';
    if (iconPath.startsWith('weapon_')) {
      subfolder = 'weapon_i/';
    } else if (iconPath.startsWith('armor_')) {
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
    } else if (iconPath.startsWith('etc_') || iconPath.startsWith('giant_')) {
      // Handle etc_ and giant_ prefixed icons
      subfolder = 'etc_i/';
    } else if (iconPath.startsWith('skill')) {
      // Handle both skill_ and skill[number] formats
      subfolder = 'skill_i/';
    } else {
      // Default to skill_i for skills (since this is extractSkillIconPath)
      subfolder = 'skill_i/';
    }
    
    return subfolder + iconPath;
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
      add_name: node.getAttribute('add_name') || null,
      type: 'weapon',
      itemType: null,
      slot: null,
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
    
    // Extract slot information
    const slotNodes = node.querySelectorAll('equip > slot');
    if (slotNodes.length > 0) {
      const slots = [];
      slotNodes.forEach((slotNode) => {
        const slotId = slotNode.getAttribute('id');
        if (slotId) slots.push(slotId);
      });
      item.slot = slots.join(',');
    }
    
    items.push(item);
  });
  
  // Parse armor
  const armorNodes = xmlDoc.querySelectorAll('armor');
  armorNodes.forEach((node) => {
    const item = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      add_name: node.getAttribute('add_name') || null,
      type: 'armor',
      itemType: null,
      slot: null,
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
    
    // Extract slot information
    const slotNodes = node.querySelectorAll('equip > slot');
    if (slotNodes.length > 0) {
      const slots = [];
      slotNodes.forEach((slotNode) => {
        const slotId = slotNode.getAttribute('id');
        if (slotId) slots.push(slotId);
      });
      item.slot = slots.join(',');
    }
    
    items.push(item);
  });
  
  // Parse etcitems
  const etcNodes = xmlDoc.querySelectorAll('etcitem');
  etcNodes.forEach((node) => {
    const item = {
      id: node.getAttribute('id'),
      name: node.getAttribute('name'),
      add_name: node.getAttribute('add_name') || null,
      type: 'etcitem',
      itemType: null,
      slot: null,
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
    
    // Extract slot information
    const slotNodes = node.querySelectorAll('equip > slot');
    if (slotNodes.length > 0) {
      const slots = [];
      slotNodes.forEach((slotNode) => {
        const slotId = slotNode.getAttribute('id');
        if (slotId) slots.push(slotId);
      });
      item.slot = slots.join(',');
    }
    
    items.push(item);
  });
  
  return items;
}

/**
 * Get icon path from XML item data
 */
export function getItemIconPath(iconValue) {
  if (!iconValue) return null;
  
  let iconPath = iconValue;
  let isBrCashtex = false;
  let isBranchIcon = false;
  
  // Check if it's a BranchIcon icon
  if (iconPath.startsWith('BranchIcon.')) {
    // BranchIcon.Icon.etc_vip_present_i03 -> BranchIcon/Icon/etc_vip_present_i03
    // BranchIcon.Panel.filename -> BranchIcon/Panel/filename
    iconPath = iconPath.replace(/\./g, '/');
    isBranchIcon = true;
  } else if (iconPath.startsWith('br_cashtex.item.')) {
    // Check if it's a br_cashtex icon
    iconPath = iconPath.replace('br_cashtex.item.', '');
    isBrCashtex = true;
  } else {
    // Remove 'icon.' prefix for regular icons
    iconPath = iconPath.replace('icon.', '');
  }
  
  // For BranchIcon icons, return the path as-is (already formatted with slashes)
  if (isBranchIcon) {
    return iconPath;
  }
  
  // For br_cashtex icons, return the path without subfolder
  if (isBrCashtex) {
    return iconPath;
  }
  
  // Handle item_ prefixed icons (Item_Normal, Item_CanUse, etc.) - they are in the root Icon folder
  if (iconPath.startsWith('item_')) {
    // Convert to proper case: item_normal06 -> Item_Normal06, item_canuse28 -> Item_CanUse28
    const parts = iconPath.split('_');
    
    // Special case mappings for known compound words
    const specialCases = {
      'canuse': 'CanUse',
      'normal': 'Normal',
      'system': 'System',
      'gragonskill': 'Gragonskill'
    };
    
    const capitalizedParts = parts.map((part, index) => {
      if (index === 0) {
        // First part is always 'item' -> 'Item'
        return 'Item';
      }
      // Check if this part (without numbers) is in special cases
      const textPart = part.replace(/\d+$/, '');
      const numberPart = part.match(/\d+$/) ? part.match(/\d+$/)[0] : '';
      
      if (specialCases[textPart.toLowerCase()]) {
        return specialCases[textPart.toLowerCase()] + numberPart;
      }
      
      // Default: capitalize first letter
      return part.charAt(0).toUpperCase() + part.slice(1);
    });
    
    return capitalizedParts.join('_');
  }
  
  // Determine subfolder based on icon prefix for regular icons
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
  } else if (iconPath.startsWith('skill')) {
    // Handle both skill_ and skill[number] formats
    subfolder = 'skill_i/';
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

/**
 * Parse Multisell XML files (from xml/multisell folder)
 */
export function parseMultisellXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Parse config - get all attributes dynamically
  const configNode = xmlDoc.querySelector('config');
  const config = {};
  if (configNode) {
    Array.from(configNode.attributes).forEach(attr => {
      config[attr.name] = attr.value;
    });
  }
  // Ensure default values for common attributes
  if (!config.showall) config.showall = 'false';
  if (!config.notax) config.notax = 'false';
  if (!config.keepenchanted) config.keepenchanted = 'false';
  if (!config.nokey) config.nokey = 'false';
  if (!config.is_chanced) config.is_chanced = 'false';
  
  // Parse items
  const items = [];
  const itemNodes = xmlDoc.querySelectorAll('list > item');
  
  itemNodes.forEach((itemNode, index) => {
    const ingredients = [];
    const ingredientNodes = itemNode.querySelectorAll('ingredient');
    ingredientNodes.forEach((ing) => {
      const ingredient = {
        id: ing.getAttribute('id'),
        count: ing.getAttribute('count')
      };
      // Parse all additional attributes
      Array.from(ing.attributes).forEach(attr => {
        if (attr.name !== 'id' && attr.name !== 'count') {
          ingredient[attr.name] = attr.value;
        }
      });
      ingredients.push(ingredient);
    });
    
    const productions = [];
    const productionNodes = itemNode.querySelectorAll('production');
    productionNodes.forEach((prod) => {
      const production = {
        id: prod.getAttribute('id'),
        count: prod.getAttribute('count')
      };
      // Parse all additional attributes (chance, enchant, elemental attributes, etc.)
      Array.from(prod.attributes).forEach(attr => {
        if (attr.name !== 'id' && attr.name !== 'count') {
          production[attr.name] = attr.value;
        }
      });
      productions.push(production);
    });
    
    items.push({
      index,
      ingredients,
      productions
    });
  });
  
  return { config, items };
}

/**
 * Serialize Multisell data back to XML
 */
export function serializeMultisellXML(data) {
  let xml = `<?xml version='1.0' encoding='utf-8'?>\n<list>\n`;
  
  // Add config - output all attributes dynamically
  const configAttrs = Object.entries(data.config)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  xml += `  <config ${configAttrs} />\n\n`;
  
  // Add items
  data.items.forEach((item) => {
    xml += `  <item>\n`;
    
    // Add ingredients with all attributes
    item.ingredients.forEach((ing) => {
      const attrs = Object.entries(ing)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      xml += `    <ingredient ${attrs} />\n`;
    });
    
    // Add productions with all attributes
    item.productions.forEach((prod) => {
      const attrs = Object.entries(prod)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      xml += `    <production ${attrs} />\n`;
    });
    
    xml += `  </item>\n\n`;
  });
  
  xml += `</list>\n`;
  
  return xml;
}
