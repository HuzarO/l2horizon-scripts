# L2 Horizon Scripts

Comprehensive data management tools and editor for Lineage 2 Classic server files.

## 📁 Project Structure

```
l2horizon-scripts/
├── public/                 # Public assets directory
│   ├── txt/                # Game data files (ItemName, Armorgrp, etc.)
│   └── Icon/               # Game icon assets (weapon_i, armor_i, etc_i, etc.)
├── xml/                    # XML configuration files
│   ├── armor_sets.xml      # Armor set definitions
│   └── stats/              # Skill and stat definitions
├── src/                    # React frontend source code
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Main application component
│   └── utils/              
│       └── fileParser.js   # Parser utilities for game data files
├── server.js               # Express backend API
├── vite.config.js          # Vite configuration
├── index.html              # HTML entry point
├── skills-info.txt         # Skill system documentation
└── package.json            # Project dependencies and scripts

```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Game data files in `public/txt/` directory
- Game icons in `public/Icon/` directory
- XML files in `xml/` directory

### Installation

```bash
# Install dependencies
npm install
# or
yarn
```

### Running the Editor

```bash
# Start the full-stack editor (backend + frontend)
npm start
# or
yarn start

# Development mode (frontend only, with hot reload)
npm run dev
# or
yarn dev

# Backend server only
npm run server
# or
yarn server
```

The editor will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🛠️ Tools

### 1. Web Editor

A full-featured React application for editing game data files:

**Features:**
- **Item Editor**: Edit ItemName, Weapongrp, Armorgrp, EtcItemgrp files
  - Inline table cell editing for names, descriptions, and additional names
  - Detailed property editing dialog (durability, weight, MP, soulshots, etc.)
  - Multi-filter system (crystal type, weapon type, armor type, item type)
  - Search functionality across item names, IDs, and descriptions
  - Item duplication with auto-incremented ID assignment
  - Icon browser and editor with live preview and icon path validation
  - Crystal grade badges (No Grade, D, C, B, A, S)
  - Sortable columns (ID and Name, ascending/descending)
  - Pagination with configurable rows per page
  - Bulk save operations with automatic backups

- **Skills Editor**: Edit SkillName and Skillgrp files
  - View and edit skill properties (MP/HP consumption, cast range, etc.)
  - Search across skill IDs, names, and descriptions
  - Inline cell editing for quick changes
  - **Mass Duplicate with Modifications**: Duplicate all levels of a skill at once
    - Automatically duplicates all levels (1-30, 1-40, etc.) in both files
    - Assign new skill ID and name
    - Mass modify MP consumption (add/multiply/set value)
    - Mass modify HP consumption (add/multiply/set value)
    - Mass modify cast range (add/multiply/set value)
    - Live preview showing before/after values for first 5 levels
  - Icon display with skill icons
  - Edit individual skill levels or batch operations

- **Tools Tab**: GUI interface for automation scripts
  - Generate SetItemGrp from armor_sets.xml
  - Update name_class values automatically
  - Real-time console output with color-coded logs
  - Progress indicators for long-running operations

**Technologies:**
- Frontend: React 18, Material-UI 5, Vite 5
- Backend: Node.js, Express 5, xml2js
- Dark theme UI with responsive design and mobile support

### 2. GUI Tools (Built-in)

The web editor includes a **Tools** tab with GUI interfaces for common operations:

**Generate SetItemGrp:**
- Automatically generates `SetItemGrp_Classic-eu.txt` from `armor_sets.xml`
- Extracts skill effects from skill XML files with descriptions
- Supports essential and shield bonus effects
- Real-time console output

**Update Name Class:**
- Updates `name_class` property in ItemName based on SetItemGrp chest pieces
- Shows detailed change log with updates count
- Preserves existing values when correct
- Color-coded status messages

## 📝 File Formats

### ItemName Format
```
item_name_begin	id=1	name=[Item Name]	additionalname=[Additional]	description=[Description]	...	item_name_end
```

### SetItemGrp Format
```
setitem_group_begin	num=0	essential_setitem_id={{...}}	essential_setitem_desc={{...}}	additional_setitem_id={{...}}	additional_setitem_desc={{...}}	unk1=0	unk2=0	enchant_setitem_condition={}	setitem_group_end
```

## 🎯 Use Cases

1. **Item Database Management**: Edit thousands of items with search, filter, and bulk operations
2. **Armor Set Configuration**: Generate SetItemGrp from XML definitions
3. **Item Classification**: Automatically assign name_class for set items
4. **Icon Management**: Browse and assign icons from icon directories
5. *kills System Documentation](skills-info.txt)
- [Contributing Guidelines](CONTRIBUTIN
- [SetItemGrp Generation Guide](README-SETITEMGRP.md)
- [Skills System Documentation](skills-info.txt)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

1. Keep data files in `public/txt/` directory (ignored by git)
2. Keep icon files in `public/Icon/` directory (ignored by git)
3. Maintain XML structure in `xml/` directory
4. Follow existing code style
5. Test changes before committing

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Troubleshooting

### Editor won't start
```bash
# Clear dependencies and reinstall
rm -rf node_modules
npm install
# or
yarn
```

### Data not loading
- Ensure `public/txt/` directory contains required .txt files
- Verify icons are in `public/Icon/` subdirectories
- Check file permissions:
  - ItemName_Classic-eu.txt
  - Weapongrp_Classic.txt
  - Armorgrp_Classic.txt
  - EtcItemgrp_Classic.txt
- Verify icons are in `public/Icon/` subdirectories (weapon_i, armor_i, etc_i, etc.)
- Check browser console for fetch errors
- Verify file paths are correct (should be /txt/, not /dat/)
- Check file permissions and encoding (UTF-8 recommended)
- Check that port 3001 is not in use
- Verify xml2js dependency is installed
- Check server.js logs for details

## 🔧 Advanced Configuration

### Custom Ports
- **Frontend**: Edit `vite.config.js` (default: 3000)
- **Backend**: Edit `server.js` (default: 3001)

### Data Directory
Place your game data files in the following structure:
```
public/
├── txt/
│   ├── ItemName_Classic-eu.txt
│   ├── Weapongrp_Classic.txt
│   ├── Armorgrp_Classic.txt
│   ├── EtcItemgrp_Classic.txt
│   └── SetItemGrp_Classic-eu.txt
└── Icon/
    ├── weapon_i/
    ├── etc_i/
    ├── armor_i/
    └── ...
```

### Build for Production
```bash
npm run build
# or
yarn build

# Preview production build
npm run preview
# or
yarn preview
```

---

**Built for L2 Horizon** | Optimized for Classic Chronicles
