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
