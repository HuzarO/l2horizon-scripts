# Skills Mass Duplicate Feature Guide

## Overview

The Skills Editor now includes a powerful **Mass Duplicate with Modifications** feature that allows you to duplicate all levels of a skill at once and apply mass modifications to properties like MP consumption, HP consumption, and cast range.

## Features

### 1. Duplicate All Skill Levels
- When you duplicate a skill, **ALL levels** of that skill are automatically duplicated
- Both SkillName_Classic-eu.txt and Skillgrp_Classic.txt entries are duplicated
- Example: If a skill has levels 1-30, all 30 levels are duplicated with one click

### 2. Auto-Increment Skill ID
- The system automatically finds the highest skill ID in your database
- Assigns the next available ID to the duplicated skill
- You can manually change the suggested ID if needed

### 3. Mass Property Modifications

Apply modifications to all skill levels at once using three different modes:

#### MP Consumption Modifications
- **Add**: Add a fixed value to each level's MP consumption
  - Example: Add +10 MP to all levels
- **Multiply**: Multiply each level's MP consumption by a factor
  - Example: Multiply by 1.5 to increase all MP costs by 50%
- **Set**: Set all levels to the same MP consumption value
  - Example: Set all levels to 100 MP

#### HP Consumption Modifications
- Same modes as MP consumption (Add/Multiply/Set)
- Useful for skills that consume HP instead of or in addition to MP

#### Cast Range Modifications
- Same modes as MP/HP (Add/Multiply/Set)
- Adjust the casting range for all skill levels at once
- Example: Add +100 range to all levels for a long-range version

### 4. Live Preview
- See the before/after values for the first 5 levels
- Verify your modifications before applying them
- Shows original values → new values for MP, HP, and Range

## How to Use

### Step 1: Navigate to Skills Tab
1. Open the L2 Horizon Scripts editor
2. Click on the **Skills** tab (second tab)
3. Search for the skill you want to duplicate

### Step 2: Initiate Duplicate
1. Find the skill in the table
2. Click the **Duplicate** button (copy icon) next to any level of that skill
3. The Mass Duplicate dialog will open

### Step 3: Configure Duplication

#### Basic Settings
1. **Original Skill ID**: Shows the source skill ID (read-only)
2. **New Skill ID**: Auto-assigned, but you can change it
3. **New Skill Name**: Default is "Copy of [Original Name]", edit as needed

#### Mass Modifications (Optional)
For each property (MP, HP, Cast Range):

1. **Select Modification Type**:
   - **Add**: Adds a value to existing values
   - **Multiply**: Multiplies existing values by a factor
   - **Set**: Sets all levels to the same value

2. **Enter Value**:
   - For Add: Enter the amount to add (can be negative)
   - For Multiply: Enter the multiplication factor (e.g., 1.5 for 150%)
   - For Set: Enter the exact value for all levels

3. **Leave as 0** if you don't want to modify that property

#### Preview Section
- Check the "Preview (First 5 Levels)" table
- Verify the changes look correct
- Shows: Level | MP (Original → New) | HP (Original → New) | Range (Original → New)

### Step 4: Confirm Duplication
1. Review all settings and preview
2. Click **Duplicate All Levels**
3. A success message will confirm the duplication
4. The search will automatically filter to show your new skill
5. Click **Save Skills** to persist changes to files

## Use Cases

### Example 1: Create a "Greater" Version of a Skill
```
Original: Heal (ID: 1230) - 30 levels
- MP consumption ranges from 50 to 150

Create: Greater Heal (ID: 5001) - 30 levels
- MP Modification: Multiply by 1.5
- Cast Range: Add +50
- Result: MP consumption ranges from 75 to 225, all ranges +50
```

### Example 2: Create a Budget Version
```
Original: Major Heal (ID: 1231) - 25 levels
- MP consumption ranges from 100 to 300

Create: Minor Heal (ID: 5002) - 25 levels
- MP Modification: Multiply by 0.5
- Result: MP consumption ranges from 50 to 150
```

### Example 3: Create a Fixed-Cost Version
```
Original: Power Strike (ID: 3) - 20 levels

Create: Fixed Power Strike (ID: 5003) - 20 levels
- MP Modification: Set to 50
- Result: All levels use exactly 50 MP
```

### Example 4: Long-Range Variant
```
Original: Ice Bolt (ID: 1177) - 30 levels
- Cast range: 600 for all levels

Create: Long-Range Ice Bolt (ID: 5004) - 30 levels
- Cast Range: Add +300
- Result: Cast range becomes 900 for all levels
```

## Important Notes

### Before Duplicating
- ✅ Make backups of your .txt files
- ✅ Ensure you have enough unused skill IDs
- ✅ Plan your modifications carefully

### After Duplicating
- ⚠️ Click **Save Skills** to persist changes
- ⚠️ Review duplicated skills in the table
- ⚠️ Test in-game before deploying to production
- ⚠️ Check that both SkillName and Skillgrp files are updated

### Limitations
- The duplicate feature copies all levels at once (you cannot select specific levels)
- Icon paths are preserved from the original skill
- Sublevel variations are also duplicated if present
- Modifications apply uniformly across all levels

## Technical Details

### Files Modified
- **SkillName_Classic-eu.txt**: Contains skill names and descriptions
- **Skillgrp_Classic.txt**: Contains skill properties (MP, HP, cast times, etc.)

### Data Preserved
All original skill data is preserved including:
- skill_id (changed to new ID)
- skill_level (preserved)
- skill_sublevel (preserved)
- name (changed to new name)
- All other properties (icon, animation, effects, etc.)

### Properties That Can Be Modified
Currently supported mass modifications:
- mp_consume
- hp_consume
- cast_range

Other properties are copied as-is and can be edited individually after duplication.

## Troubleshooting

### Duplicate Not Appearing
- Make sure you clicked "Save Skills" 
- Check the search box - it should auto-filter to the new skill ID
- Clear the search to see all skills

### Modifications Not Applied
- Verify the modification value is not "0"
- Check the preview table to see if values changed
- Ensure the original skill has the property you're trying to modify

### Skill ID Conflict
- If the suggested ID is already in use, change it manually
- Find an unused ID range in your database
- Typical L2 custom skill IDs start from 5000+

## Best Practices

1. **Naming Convention**: Use clear, descriptive names for duplicated skills
2. **ID Management**: Keep a list of custom skill IDs to avoid conflicts
3. **Testing**: Always test duplicated skills on a test server first
4. **Documentation**: Document your custom skills for future reference
5. **Backups**: Keep backups before making large-scale changes
6. **Incremental Changes**: Duplicate and test one skill at a time initially

## Future Enhancements

Potential future additions to this feature:
- Selective level duplication (e.g., only levels 1-10)
- More property mass modifications (cooldown, cast time, etc.)
- Batch duplicate multiple skills
- Export/import duplicate configurations
- Skill comparison view

## Support

If you encounter issues:
1. Check the browser console for errors (F12)
2. Verify both .txt files are writable
3. Check that the backend server is running (port 3001)
4. Review the [main README](README.md) for general troubleshooting

---

**Feature Added**: January 2025
**Compatible With**: L2 Classic Chronicles
**Tested On**: Skills with levels 1-40
