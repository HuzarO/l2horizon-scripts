import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Upload as UploadIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ContentCopy as ContentCopyIcon,
  Build as BuildIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { parseItemNameFile, parseItemGroupFile, serializeItemNameFile, serializeItemGroupFile, extractIconPath, parseSkillNameFile, parseSkillGrpFile, serializeSkillNameFile, serializeSkillGrpFile, extractSkillIconPath } from './utils/fileParser';

// Helper to strip brackets for display
const stripBrackets = (value) => {
  if (!value) return value;
  const str = String(value);
  if (str.startsWith('[') && str.endsWith(']')) {
    return str.substring(1, str.length - 1);
  }
  return str;
};

// Helper to add brackets for storage
const addBrackets = (value, fieldName) => {
  const bracketFields = ['name', 'additionalname', 'description', 'default_action', 'Tooltip_Texture'];
  if (bracketFields.includes(fieldName) && value) {
    const str = String(value);
    if (!str.startsWith('[')) {
      return `[${str}]`;
    }
  }
  return value;
};

function App() {
  const [items, setItems] = useState([]);
  const [weaponData, setWeaponData] = useState([]);
  const [armorData, setArmorData] = useState([]);
  const [etcData, setEtcData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { itemId, field }
  const [editingValue, setEditingValue] = useState('');
  const [filters, setFilters] = useState({
    crystalTypes: [],
    weaponTypes: [],
    armorTypes: [],
    itemTypes: [] // weapon, armor, etc
  });
  const [sortBy, setSortBy] = useState(null); // 'id' or 'name'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [iconPreview, setIconPreview] = useState(null);
  const [toolsLog, setToolsLog] = useState([]);
  const [toolsRunning, setToolsRunning] = useState(false);
  
  // Skills state
  const [skills, setSkills] = useState([]);
  const [skillGrpData, setSkillGrpData] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [skillPage, setSkillPage] = useState(0);
  const [skillRowsPerPage, setSkillRowsPerPage] = useState(25);
  const [currentSkill, setCurrentSkill] = useState(null);
  const [editSkillDialogOpen, setEditSkillDialogOpen] = useState(false);
  const [editingSkillCell, setEditingSkillCell] = useState(null); // { skillId, skillLevel, skillSublevel, field }
  const [editingSkillValue, setEditingSkillValue] = useState('');

  // Load data from files
  useEffect(() => {
    loadFiles();
  }, []);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = items;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply crystal type filter
    if (filters.crystalTypes.length > 0) {
      filtered = filtered.filter(item => {
        const relatedData = getRelatedItemData(item.id);
        return relatedData && filters.crystalTypes.includes(relatedData.crystal_type);
      });
    }
    
    // Apply weapon type filter
    if (filters.weaponTypes.length > 0) {
      filtered = filtered.filter(item => {
        const relatedData = getRelatedItemData(item.id);
        return relatedData && filters.weaponTypes.includes(relatedData.weapon_type);
      });
    }
    
    // Apply armor type filter
    if (filters.armorTypes.length > 0) {
      filtered = filtered.filter(item => {
        const relatedData = getRelatedItemData(item.id);
        return relatedData && filters.armorTypes.includes(relatedData.armor_type);
      });
    }
    
    // Apply item type filter (weapon/armor/etc)
    if (filters.itemTypes.length > 0) {
      filtered = filtered.filter(item => {
        const relatedData = getRelatedItemData(item.id);
        return relatedData && filters.itemTypes.includes(relatedData._type);
      });
    }
    
    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'id') {
          aValue = parseInt(a.id) || 0;
          bValue = parseInt(b.id) || 0;
        } else if (sortBy === 'name') {
          aValue = stripBrackets(a.name || '').toLowerCase();
          bValue = stripBrackets(b.name || '').toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    
    setFilteredItems(filtered);
    setPage(0);
  }, [searchTerm, items, filters, weaponData, armorData, etcData, sortBy, sortDirection]);

  // Filter skills based on search
  useEffect(() => {
    let filtered = skills;
    
    if (skillSearchTerm) {
      filtered = filtered.filter(skill =>
        stripBrackets(skill.name || '').toLowerCase().includes(skillSearchTerm.toLowerCase()) ||
        skill.skill_id?.toString().includes(skillSearchTerm) ||
        stripBrackets(skill.desc || '').toLowerCase().includes(skillSearchTerm.toLowerCase()) ||
        skill.skill_level?.toString().includes(skillSearchTerm)
      );
    }
    
    setFilteredSkills(filtered);
    setSkillPage(0);
  }, [skillSearchTerm, skills]);

  const loadFiles = async () => {
    try {
      // Load ItemName file
      const itemNameResponse = await fetch('/txt/ItemName_Classic-eu.txt');
      const itemNameText = await itemNameResponse.text();
      const parsedItems = parseItemNameFile(itemNameText);
      setItems(parsedItems);
      setFilteredItems(parsedItems);

      // Load Weapon data
      const weaponResponse = await fetch('/txt/Weapongrp_Classic.txt');
      const weaponText = await weaponResponse.text();
      const parsedWeapons = parseItemGroupFile(weaponText, 'weapon');
      setWeaponData(parsedWeapons);

      // Load Armor data
      const armorResponse = await fetch('/txt/Armorgrp_Classic.txt');
      const armorText = await armorResponse.text();
      const parsedArmor = parseItemGroupFile(armorText, 'armor');
      setArmorData(parsedArmor);

      // Load Etc data
      const etcResponse = await fetch('/txt/EtcItemgrp_Classic.txt');
      const etcText = await etcResponse.text();
      const parsedEtc = parseItemGroupFile(etcText, 'etc');
      setEtcData(parsedEtc);
      
      // Load Skills data
      try {
        const skillNameResponse = await fetch('/txt/SkillName_Classic-eu.txt');
        const skillNameText = await skillNameResponse.text();
        const parsedSkillNames = parseSkillNameFile(skillNameText);
        setSkills(parsedSkillNames);
        setFilteredSkills(parsedSkillNames);

        const skillGrpResponse = await fetch('/txt/Skillgrp_Classic.txt');
        const skillGrpText = await skillGrpResponse.text();
        const parsedSkillGrp = parseSkillGrpFile(skillGrpText);
        setSkillGrpData(parsedSkillGrp);
      } catch (skillError) {
        console.log('Skills files not found or error loading:', skillError);
      }

      showSnackbar('Files loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading files:', error);
      showSnackbar('Error loading files: ' + error.message, 'error');
    }
  };

  const getRelatedItemData = (itemId) => {
    const id = itemId?.toString();
    return (
      weaponData.find(w => w.object_id === id) ||
      armorData.find(a => a.object_id === id) ||
      etcData.find(e => e.object_id === id)
    );
  };

  const handleEditClick = (item) => {
    const relatedData = getRelatedItemData(item.id);
    setCurrentItem({ ...item, _relatedData: relatedData ? { ...relatedData } : null });
    setIconPreview(getIconUrl(item.id));
    setEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  };

  const handleRelatedDataChange = (field, value) => {
    setCurrentItem(prev => ({
      ...prev,
      _relatedData: { ...prev._relatedData, [field]: value }
    }));
    
    // Update icon preview if icon field changed
    if (field === 'icon') {
      const iconPath = extractIconPath(value);
      if (iconPath) {
        setIconPreview(`/Icon/${iconPath}.png`);
      }
    }
  };

  const handleSaveEdit = () => {
    const updatedItems = items.map(item =>
      item.id === currentItem.id ? currentItem : item
    );
    setItems(updatedItems);
    
    // Also update related data if modified
    if (currentItem._relatedData) {
      const relatedData = currentItem._relatedData;
      if (relatedData._type === 'weapon') {
        setWeaponData(weaponData.map(w => 
          w.object_id === currentItem.id ? relatedData : w
        ));
      } else if (relatedData._type === 'armor') {
        setArmorData(armorData.map(a => 
          a.object_id === currentItem.id ? relatedData : a
        ));
      } else if (relatedData._type === 'etc') {
        setEtcData(etcData.map(e => 
          e.object_id === currentItem.id ? relatedData : e
        ));
      }
    }
    
    setEditDialogOpen(false);
    showSnackbar('Item updated successfully', 'success');
  };

  const handleCellClick = (item, field) => {
    setEditingCell({ itemId: item.id, field });
    let value = stripBrackets(item[field]) || '';
    // Convert \n to actual newlines for editing
    if (field === 'description') {
      value = value.replace(/\\n/g, '\n');
    }
    setEditingValue(value);
  };

  const handleCellSave = (itemId, field, value) => {
    // Convert actual newlines to \n for storage
    let processedValue = value;
    if (field === 'description') {
      processedValue = value.replace(/\n/g, '\\n');
    }
    
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: addBrackets(processedValue, field) };
      }
      return item;
    });
    setItems(updatedItems);
    setEditingCell(null);
    showSnackbar('Field updated', 'success');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      handleCellSave(editingCell.itemId, editingCell.field, editingValue);
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Skill cell editing handlers
  const handleSkillCellClick = (skill, field) => {
    setEditingSkillCell({ 
      skillId: skill.skill_id, 
      skillLevel: skill.skill_level, 
      skillSublevel: skill.skill_sublevel, 
      field 
    });
    let value = stripBrackets(skill[field]) || '';
    // Convert \\n to actual newlines for editing
    if (field === 'desc') {
      value = value.replace(/\\\\n/g, '\n');
    }
    setEditingSkillValue(value);
  };

  const handleSkillCellSave = (skillId, skillLevel, skillSublevel, field, value) => {
    // Special handling for skill_id changes
    if (field === 'skill_id') {
      const newSkillId = value.trim();
      
      // Validate that the new ID is not empty
      if (!newSkillId) {
        showSnackbar('Skill ID cannot be empty', 'error');
        setEditingSkillCell(null);
        return;
      }
      
      // Check if the new ID already exists (excluding the current skill)
      const isDuplicate = skills.some(s => 
        s.skill_id === newSkillId && 
        s.skill_level === skillLevel && 
        s.skill_sublevel === skillSublevel &&
        !(s.skill_id === skillId && s.skill_level === skillLevel && s.skill_sublevel === skillSublevel)
      );
      
      if (isDuplicate) {
        showSnackbar(`Skill ID ${newSkillId} with level ${skillLevel} and sublevel ${skillSublevel} already exists!`, 'error');
        setEditingSkillCell(null);
        return;
      }
      
      // Update skill_id in both skills and skillGrpData
      const updatedSkills = skills.map(skill => {
        if (skill.skill_id === skillId && 
            skill.skill_level === skillLevel && 
            skill.skill_sublevel === skillSublevel) {
          return { ...skill, skill_id: newSkillId };
        }
        return skill;
      });
      
      const updatedSkillGrp = skillGrpData.map(skill => {
        if (skill.skill_id === skillId && 
            skill.skill_level === skillLevel && 
            skill.skill_sublevel === skillSublevel) {
          return { ...skill, skill_id: newSkillId };
        }
        return skill;
      });
      
      setSkills(updatedSkills);
      setSkillGrpData(updatedSkillGrp);
      setEditingSkillCell(null);
      showSnackbar(`Skill ID updated to ${newSkillId} in both files`, 'success');
      return;
    }
    
    // Convert actual newlines to \\n for storage
    let processedValue = value;
    if (field === 'desc') {
      processedValue = value.replace(/\n/g, '\\\\n');
    }
    
    const updatedSkills = skills.map(skill => {
      if (skill.skill_id === skillId && 
          skill.skill_level === skillLevel && 
          skill.skill_sublevel === skillSublevel) {
        return { ...skill, [field]: `[${processedValue}]` };
      }
      return skill;
    });
    setSkills(updatedSkills);
    setEditingSkillCell(null);
    showSnackbar('Skill field updated', 'success');
  };

  const handleSkillCellBlur = () => {
    if (editingSkillCell) {
      handleSkillCellSave(
        editingSkillCell.skillId, 
        editingSkillCell.skillLevel, 
        editingSkillCell.skillSublevel,
        editingSkillCell.field, 
        editingSkillValue
      );
    }
  };

  const handleSkillCellKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSkillCellBlur();
    } else if (e.key === 'Escape') {
      setEditingSkillCell(null);
    }
  };

  const handleSave = async () => {
    try {
      const itemNameContent = serializeItemNameFile(items);
      const weaponContent = serializeItemGroupFile(weaponData);
      const armorContent = serializeItemGroupFile(armorData);
      const etcContent = serializeItemGroupFile(etcData);
      
      const response = await fetch('http://localhost:3001/api/save/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemName: itemNameContent,
          weapon: weaponContent,
          armor: armorContent,
          etc: etcContent
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSnackbar(result.message + ' ✅', 'success');
      } else {
        showSnackbar('Error saving files: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving files:', error);
      showSnackbar('Error connecting to server. Make sure backend is running.', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const clearFilters = () => {
    setFilters({
      crystalTypes: [],
      weaponTypes: [],
      armorTypes: [],
      itemTypes: []
    });
  };

  const getUniqueValues = (dataArray, property) => {
    const values = new Set();
    dataArray.forEach(item => {
      if (item[property]) {
        values.add(item[property]);
      }
    });
    return Array.from(values).sort();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if clicking same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${stripBrackets(item.name)}" (ID: ${item.id})? This will remove it from all related files.`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/delete/item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item.id }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setItems(prev => prev.filter(i => i.id !== item.id));
        setWeaponData(prev => prev.filter(i => i.object_id !== item.id));
        setArmorData(prev => prev.filter(i => i.object_id !== item.id));
        setEtcData(prev => prev.filter(i => i.object_id !== item.id));
        
        showSnackbar(result.message + ' ✅', 'success');
      } else {
        showSnackbar('Error deleting item: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Error connecting to server. Make sure backend is running.', 'error');
    }
  };

  const handleDuplicate = (item) => {
    // Find max ID across all items
    const allIds = items.map(i => parseInt(i.id) || 0);
    const maxId = Math.max(...allIds, 0);
    const newId = (maxId + 1).toString();
    
    // Create new item with new ID
    const newItem = {
      ...item,
      id: newId,
      name: `[Copy of ${stripBrackets(item.name)}]`,
    };
    
    // Add to items
    setItems(prev => [...prev, newItem]);
    
    // If item has related data, duplicate it too
    const relatedData = getRelatedItemData(item.id);
    if (relatedData) {
      const newRelatedData = {
        ...relatedData,
        object_id: newId,
        tag: '0', // Reset tag for new item
      };
      
      if (relatedData._type === 'weapon') {
        setWeaponData(prev => [...prev, newRelatedData]);
      } else if (relatedData._type === 'armor') {
        setArmorData(prev => [...prev, newRelatedData]);
      } else if (relatedData._type === 'etc') {
        setEtcData(prev => [...prev, newRelatedData]);
      }
    }
    
    showSnackbar(`Item duplicated with ID: ${newId}`, 'success');
  };

  // Skill handlers
  const getRelatedSkillData = (skillId, skillLevel, skillSublevel) => {
    return skillGrpData.find(s => 
      s.skill_id === skillId && 
      s.skill_level === skillLevel && 
      s.skill_sublevel === skillSublevel
    );
  };

  const handleEditSkillClick = (skill) => {
    const relatedData = getRelatedSkillData(skill.skill_id, skill.skill_level, skill.skill_sublevel);
    setCurrentSkill({ ...skill, _relatedData: relatedData ? { ...relatedData } : null });
    setEditSkillDialogOpen(true);
  };

  const handleEditSkillChange = (field, value) => {
    setCurrentSkill(prev => ({ ...prev, [field]: value }));
  };

  const handleRelatedSkillDataChange = (field, value) => {
    setCurrentSkill(prev => ({
      ...prev,
      _relatedData: { ...prev._relatedData, [field]: value }
    }));
  };

  const handleSkillSave = () => {
    // Update in skills array
    setSkills(prev => prev.map(s => 
      (s.skill_id === currentSkill.skill_id && 
       s.skill_level === currentSkill.skill_level && 
       s.skill_sublevel === currentSkill.skill_sublevel) 
        ? { ...currentSkill, _relatedData: undefined } 
        : s
    ));

    // Update related skillgrp data if it exists
    if (currentSkill._relatedData) {
      setSkillGrpData(prev => prev.map(s => 
        (s.skill_id === currentSkill.skill_id && 
         s.skill_level === currentSkill.skill_level && 
         s.skill_sublevel === currentSkill.skill_sublevel) 
          ? currentSkill._relatedData 
          : s
      ));
    }

    setEditSkillDialogOpen(false);
    showSnackbar('Skill updated locally. Click Save to persist changes.', 'info');
  };

  const handleDeleteSkill = async (skill) => {
    if (!confirm(`Are you sure you want to delete skill "${stripBrackets(skill.name)}" (ID: ${skill.skill_id}, Level: ${skill.skill_level})? This will remove it from all related files.`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/delete/skill', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          skillId: skill.skill_id,
          skillLevel: skill.skill_level,
          skillSublevel: skill.skill_sublevel
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setSkills(prev => prev.filter(s => 
          !(s.skill_id === skill.skill_id && 
            s.skill_level === skill.skill_level && 
            s.skill_sublevel === skill.skill_sublevel)
        ));
        setSkillGrpData(prev => prev.filter(s => 
          !(s.skill_id === skill.skill_id && 
            s.skill_level === skill.skill_level && 
            s.skill_sublevel === skill.skill_sublevel)
        ));
        
        showSnackbar(result.message + ' ✅', 'success');
      } else {
        showSnackbar('Error deleting skill: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      showSnackbar('Error connecting to server. Make sure backend is running.', 'error');
    }
  };

  const handleSaveSkills = async () => {
    try {
      const skillNameContent = serializeSkillNameFile(skills);
      const skillGrpContent = serializeSkillGrpFile(skillGrpData);
      
      const response = await fetch('http://localhost:3001/api/save/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          skillName: skillNameContent,
          skillGrp: skillGrpContent
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSnackbar(result.message + ' ✅', 'success');
      } else {
        showSnackbar('Error saving skill files: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving skill files:', error);
      showSnackbar('Error connecting to server. Make sure backend is running.', 'error');
    }
  };

  const getSkillIconUrl = (skill) => {
    const relatedData = getRelatedSkillData(skill.skill_id, skill.skill_level, skill.skill_sublevel);
    if (relatedData?.icon) {
      const iconPath = extractSkillIconPath(relatedData.icon);
      if (iconPath) {
        return `/${iconPath}.png`;
      }
    }
    return null;
  };

  const handleDuplicateSkill = (skill) => {
    const relatedData = getRelatedSkillData(skill.skill_id, skill.skill_level, skill.skill_sublevel);
    
    // Find max skill_id across all skills
    const allSkillIds = skills.map(s => parseInt(s.skill_id) || 0);
    const maxSkillId = Math.max(...allSkillIds, 0);
    const newSkillId = (maxSkillId + 1).toString();
    
    const newSkill = {
      ...skill,
      skill_id: newSkillId,
      skill_level: '1',
      skill_sublevel: '0',
      name: `[Copy of ${stripBrackets(skill.name)}]`,
    };
    
    // Add to skills array
    setSkills(prev => [...prev, newSkill]);
    
    // If there's related data, duplicate it too
    if (relatedData) {
      const newRelatedData = {
        ...relatedData,
        skill_id: newSkillId,
        skill_level: '1',
        skill_sublevel: '0',
      };
      setSkillGrpData(prev => [...prev, newRelatedData]);
    }
    
    // Set search term to show the duplicated skill
    setSkillSearchTerm(newSkillId);
    
    showSnackbar(`Skill duplicated with ID: ${newSkillId}`, 'success');
  };

  const handleGenerateSetItemGrp = async () => {
    setToolsRunning(true);
    setToolsLog([]);
    
    try {
      const response = await fetch('http://localhost:3001/api/tools/generate-setitemgrp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setToolsLog(result.logs || []);
        showSnackbar('SetItemGrp generated successfully!', 'success');
      } else {
        setToolsLog([{ type: 'error', message: result.message }]);
        showSnackbar('Error: ' + result.message, 'error');
      }
    } catch (error) {
      setToolsLog([{ type: 'error', message: error.message }]);
      showSnackbar('Error connecting to server', 'error');
    } finally {
      setToolsRunning(false);
    }
  };

  const handleUpdateItemNameClass = async () => {
    setToolsRunning(true);
    setToolsLog([]);
    
    try {
      const response = await fetch('http://localhost:3001/api/tools/update-name-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setToolsLog(result.logs || []);
        showSnackbar('ItemName name_class updated successfully!', 'success');
        // Reload items to reflect changes
        loadFiles();
      } else {
        setToolsLog([{ type: 'error', message: result.message }]);
        showSnackbar('Error: ' + result.message, 'error');
      }
    } catch (error) {
      setToolsLog([{ type: 'error', message: error.message }]);
      showSnackbar('Error connecting to server', 'error');
    } finally {
      setToolsRunning(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getIconUrl = (itemId) => {
    const relatedData = getRelatedItemData(itemId);
    if (relatedData?.icon) {
      const iconPath = extractIconPath(relatedData.icon);
      if (iconPath) {
        return `/Icon/${iconPath}.png`;
      }
    }
    return null;
  };

  const getCrystalType = (itemId) => {
    const relatedData = getRelatedItemData(itemId);
    if (relatedData?.crystal_type && relatedData.crystal_type !== 'none') {
      return `[${relatedData.crystal_type.toUpperCase()}]`;
    }
    return '';
  };

  const renderEditDialog = () => {
    if (!currentItem) return null;

    const relatedData = getRelatedItemData(currentItem.id);
    const iconUrl = getIconUrl(currentItem.id);

    const fields = [
      { key: 'id', label: 'ID', disabled: true },
      { key: 'name', label: 'Name' },
      { key: 'additionalname', label: 'Additional Name' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'default_action', label: 'Default Action' },
      { key: 'popup', label: 'Popup' },
      { key: 'use_order', label: 'Use Order' },
      { key: 'name_class', label: 'Name Class' },
      { key: 'color', label: 'Color' },
      { key: 'Tooltip_Texture', label: 'Tooltip Texture' },
      { key: 'is_trade', label: 'Is Trade' },
      { key: 'is_drop', label: 'Is Drop' },
      { key: 'is_destruct', label: 'Is Destruct' },
      { key: 'is_private_store', label: 'Is Private Store' },
      { key: 'keep_type', label: 'Keep Type' },
      { key: 'is_npctrade', label: 'Is NPC Trade' },
      { key: 'is_commission_store', label: 'Is Commission Store' },
    ];

    return (
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Item: {stripBrackets(currentItem.name)}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {iconUrl && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <img
                        src={iconPreview || iconUrl}
                        alt={currentItem.name}
                        style={{ maxWidth: '64px', maxHeight: '64px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <Typography variant="caption" display="block">
                        Icon Preview
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {fields.map(field => (
                <Grid item xs={12} key={field.key}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={(stripBrackets(currentItem[field.key]) || '').replace(/\\n/g, '\n')}
                    onChange={(e) => handleEditChange(field.key, addBrackets(e.target.value.replace(/\n/g, '\\n'), field.key))}
                    disabled={field.disabled}
                    multiline={field.multiline}
                    rows={field.multiline ? 4 : 1}
                    variant="outlined"
                  />
                </Grid>
              ))}

              {currentItem._relatedData && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Item Properties ({currentItem._relatedData._type})
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Icon field - always show if related data exists */}
                        {currentItem._relatedData.icon !== undefined && (
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Icon"
                              value={currentItem._relatedData.icon || ''}
                              onChange={(e) => handleRelatedDataChange('icon', e.target.value)}
                              variant="outlined"
                              size="small"
                              multiline
                              rows={2}
                              helperText="Format: {[icon.weapon_name_i00];[None];[None];[None];[None]}"
                            />
                          </Grid>
                        )}
                        {['durability', 'weight', 'crystallizable', 'mp_consume', 'mp_bonus', 'soulshot_count', 'spiritshot_count'].map(propKey => (
                          currentItem._relatedData[propKey] !== undefined && (
                            <Grid item xs={6} key={propKey}>
                              <TextField
                                fullWidth
                                label={propKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                value={currentItem._relatedData[propKey] || ''}
                                onChange={(e) => handleRelatedDataChange(propKey, e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            </Grid>
                          )
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {relatedData && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Full Related Data ({relatedData._type})
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                        {JSON.stringify(relatedData, null, 2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Lineage 2 Item Editor
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={currentTab === 2}
          >
            Save Changes
          </Button>
        </Box>
        
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Items" />
          <Tab label="Skills" />
          <Tab label="Tools" icon={<BuildIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {currentTab === 0 && (
        <>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by ID, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip label={`Total Items: ${items.length}`} color="primary" sx={{ mr: 1 }} />
          <Chip label={`Filtered: ${filteredItems.length}`} color="secondary" sx={{ mr: 1 }} />
          <Chip label={`Weapons: ${weaponData.length}`} sx={{ mr: 1 }} />
          <Chip label={`Armors: ${armorData.length}`} sx={{ mr: 1 }} />
          <Chip label={`Etc Items: ${etcData.length}`} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filters:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Item Type Filter */}
            <Box>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Item Type</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {['weapon', 'armor', 'etc'].map(type => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => toggleFilter('itemTypes', type)}
                    color={filters.itemTypes.includes(type) ? 'primary' : 'default'}
                    size="small"
                    variant={filters.itemTypes.includes(type) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {/* Crystal Type Filter */}
            <Box>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Crystal Grade</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {getUniqueValues([...weaponData, ...armorData, ...etcData], 'crystal_type').map(type => (
                  <Chip
                    key={type}
                    label={type.toUpperCase()}
                    onClick={() => toggleFilter('crystalTypes', type)}
                    color={filters.crystalTypes.includes(type) ? 'primary' : 'default'}
                    size="small"
                    variant={filters.crystalTypes.includes(type) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {/* Weapon Type Filter */}
            {weaponData.length > 0 && (
              <Box>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Weapon Type</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {getUniqueValues(weaponData, 'weapon_type').map(type => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => toggleFilter('weaponTypes', type)}
                      color={filters.weaponTypes.includes(type) ? 'primary' : 'default'}
                      size="small"
                      variant={filters.weaponTypes.includes(type) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Armor Type Filter */}
            {armorData.length > 0 && (
              <Box>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Armor Type</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {getUniqueValues(armorData, 'armor_type').map(type => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => toggleFilter('armorTypes', type)}
                      color={filters.armorTypes.includes(type) ? 'primary' : 'default'}
                      size="small"
                      variant={filters.armorTypes.includes(type) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Clear Filters Button */}
            {(filters.crystalTypes.length > 0 || filters.weaponTypes.length > 0 || 
              filters.armorTypes.length > 0 || filters.itemTypes.length > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell 
                onClick={() => handleSort('id')}
                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  ID
                  {sortBy === 'id' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('name')}
                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Name
                  {sortBy === 'name' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>Additional Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Trade</TableCell>
              <TableCell>Drop</TableCell>
              <TableCell>Destruct</TableCell>
              <TableCell>Private Store</TableCell>
              <TableCell>NPC Trade</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => {
                const relatedData = getRelatedItemData(item.id);
                const iconUrl = getIconUrl(item.id);
                
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {iconUrl && (
                        <img
                          src={iconUrl}
                          alt={item.name}
                          style={{ width: '32px', height: '32px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell 
                      onClick={() => handleCellClick(item, 'name')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'name' ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                          variant="standard"
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold" component="span">
                            {stripBrackets(item.name)}
                          </Typography>
                          {getCrystalType(item.id) && (
                            <Chip 
                              label={getCrystalType(item.id)} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem'
                              }} 
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell
                      onClick={() => handleCellClick(item, 'additionalname')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'additionalname' ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                          variant="standard"
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'medium' }}>
                          {stripBrackets(item.additionalname)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      onClick={() => handleCellClick(item, 'description')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'description' ? (
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                          variant="standard"
                        />
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {stripBrackets(item.description)?.replace(/\\n/g, '\n')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {relatedData && (
                        <Chip label={relatedData._type} size="small" color="secondary" />
                      )}
                    </TableCell>
                    <TableCell>{item.is_trade === '1' ? '✓' : '✗'}</TableCell>
                    <TableCell>{item.is_drop === '1' ? '✓' : '✗'}</TableCell>
                    <TableCell>{item.is_destruct === '1' ? '✓' : '✗'}</TableCell>
                    <TableCell>{item.is_private_store === '1' ? '✓' : '✗'}</TableCell>
                    <TableCell>{item.is_npctrade === '1' ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(item)}
                        color="primary"
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicate(item)}
                        color="secondary"
                        title="Duplicate"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        color="error"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredItems.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>

      {renderEditDialog()}
        </>
      )}

      {currentTab === 1 && (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search by skill ID, name, or description..."
                value={skillSearchTerm}
                onChange={(e) => setSkillSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveSkills}
              >
                Save Skills
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Chip label={`Total Skills: ${skills.length}`} color="primary" sx={{ mr: 1 }} />
              <Chip label={`Filtered: ${filteredSkills.length}`} color="secondary" sx={{ mr: 1 }} />
              <Chip label={`Skill Properties: ${skillGrpData.length}`} />
            </Box>
          </Paper>

          <TableContainer component={Paper} elevation={3}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Icon</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sublevel</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>MP Cost</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cast Range</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSkills
                  .slice(skillPage * skillRowsPerPage, skillPage * skillRowsPerPage + skillRowsPerPage)
                  .map((skill) => {
                    const iconUrl = getSkillIconUrl(skill);
                    const relatedData = getRelatedSkillData(skill.skill_id, skill.skill_level, skill.skill_sublevel);
                    
                    return (
                      <TableRow key={`${skill.skill_id}-${skill.skill_level}-${skill.skill_sublevel}`} hover>
                        <TableCell>
                          {iconUrl && (
                            <img
                              src={iconUrl}
                              alt={skill.name}
                              style={{ width: 32, height: 32 }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSkillCellClick(skill, 'skill_id')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {editingSkillCell?.skillId === skill.skill_id && 
                           editingSkillCell?.skillLevel === skill.skill_level && 
                           editingSkillCell?.skillSublevel === skill.skill_sublevel && 
                           editingSkillCell?.field === 'skill_id' ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={editingSkillValue}
                              onChange={(e) => setEditingSkillValue(e.target.value)}
                              onBlur={handleSkillCellBlur}
                              onKeyDown={handleSkillCellKeyDown}
                              autoFocus
                              variant="standard"
                            />
                          ) : (
                            <Typography variant="body2">{skill.skill_id}</Typography>
                          )}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSkillCellClick(skill, 'skill_level')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {editingSkillCell?.skillId === skill.skill_id && 
                           editingSkillCell?.skillLevel === skill.skill_level && 
                           editingSkillCell?.skillSublevel === skill.skill_sublevel && 
                           editingSkillCell?.field === 'skill_level' ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={editingSkillValue}
                              onChange={(e) => setEditingSkillValue(e.target.value)}
                              onBlur={handleSkillCellBlur}
                              onKeyDown={handleSkillCellKeyDown}
                              autoFocus
                              variant="standard"
                            />
                          ) : (
                            <Typography variant="body2">{skill.skill_level}</Typography>
                          )}
                        </TableCell>
                        <TableCell>{skill.skill_sublevel || '0'}</TableCell>
                        <TableCell
                          onClick={() => handleSkillCellClick(skill, 'name')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {editingSkillCell?.skillId === skill.skill_id && 
                           editingSkillCell?.skillLevel === skill.skill_level && 
                           editingSkillCell?.skillSublevel === skill.skill_sublevel && 
                           editingSkillCell?.field === 'name' ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={editingSkillValue}
                              onChange={(e) => setEditingSkillValue(e.target.value)}
                              onBlur={handleSkillCellBlur}
                              onKeyDown={handleSkillCellKeyDown}
                              autoFocus
                              variant="standard"
                            />
                          ) : (
                            <Typography variant="body2">{stripBrackets(skill.name)}</Typography>
                          )}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSkillCellClick(skill, 'desc')}
                          sx={{ maxWidth: 400, wordWrap: 'break-word', whiteSpace: 'normal', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {editingSkillCell?.skillId === skill.skill_id && 
                           editingSkillCell?.skillLevel === skill.skill_level && 
                           editingSkillCell?.skillSublevel === skill.skill_sublevel && 
                           editingSkillCell?.field === 'desc' ? (
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={3}
                              value={editingSkillValue}
                              onChange={(e) => setEditingSkillValue(e.target.value)}
                              onBlur={handleSkillCellBlur}
                              onKeyDown={handleSkillCellKeyDown}
                              autoFocus
                              variant="standard"
                            />
                          ) : (
                            <Typography variant="body2">{stripBrackets(skill.desc)}</Typography>
                          )}
                        </TableCell>
                        <TableCell>{relatedData?.mp_consume || '-'}</TableCell>
                        <TableCell>{relatedData?.cast_range || '-'}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSkillClick(skill)}
                            color="primary"
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateSkill(skill)}
                            color="secondary"
                            title="Duplicate"
                          >
                            <ContentCopyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSkill(skill)}
                            color="error"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredSkills.length}
              page={skillPage}
              onPageChange={(e, newPage) => setSkillPage(newPage)}
              rowsPerPage={skillRowsPerPage}
              onRowsPerPageChange={(e) => {
                setSkillRowsPerPage(parseInt(e.target.value, 10));
                setSkillPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </TableContainer>

          {/* Edit Skill Dialog */}
          <Dialog open={editSkillDialogOpen} onClose={() => setEditSkillDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Edit Skill: {currentSkill && stripBrackets(currentSkill.name)}</DialogTitle>
            <DialogContent>
              {currentSkill && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Skill ID"
                        value={currentSkill.skill_id || ''}
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Level"
                        value={currentSkill.skill_level || ''}
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Sublevel"
                        value={currentSkill.skill_sublevel || ''}
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={stripBrackets(currentSkill.name || '')}
                        onChange={(e) => handleEditSkillChange('name', `[${e.target.value}]`)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={stripBrackets(currentSkill.desc || '')}
                        onChange={(e) => handleEditSkillChange('desc', `[${e.target.value}]`)}
                        variant="outlined"
                        multiline
                        rows={4}
                      />
                    </Grid>

                    {currentSkill._relatedData && (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                            Skill Properties
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="MP Consume"
                            value={currentSkill._relatedData.mp_consume || ''}
                            onChange={(e) => handleRelatedSkillDataChange('mp_consume', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="HP Consume"
                            value={currentSkill._relatedData.hp_consume || ''}
                            onChange={(e) => handleRelatedSkillDataChange('hp_consume', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Cast Range"
                            value={currentSkill._relatedData.cast_range || ''}
                            onChange={(e) => handleRelatedSkillDataChange('cast_range', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Hit Time"
                            value={currentSkill._relatedData.hit_time || ''}
                            onChange={(e) => handleRelatedSkillDataChange('hit_time', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Cool Time"
                            value={currentSkill._relatedData.cool_time || ''}
                            onChange={(e) => handleRelatedSkillDataChange('cool_time', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Reuse Delay"
                            value={currentSkill._relatedData.reuse_delay || ''}
                            onChange={(e) => handleRelatedSkillDataChange('reuse_delay', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Icon"
                            value={currentSkill._relatedData.icon || ''}
                            onChange={(e) => handleRelatedSkillDataChange('icon', e.target.value)}
                            variant="outlined"
                            size="small"
                            helperText="Format: [icon.skill0001]"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditSkillDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSkillSave} variant="contained" color="primary">
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {currentTab === 2 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Tools
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate SetItemGrp
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generates SetItemGrp_Classic-eu.txt from armor_sets.xml and skill XML files.
                    This creates armor set definitions with skill effects.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={toolsRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    onClick={handleGenerateSetItemGrp}
                    disabled={toolsRunning}
                    fullWidth
                  >
                    Generate SetItemGrp
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Update Item Name Class
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Updates name_class values in ItemName_Classic-eu.txt based on
                    SetItemGrp mappings for armor set chest pieces.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={toolsRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    onClick={handleUpdateItemNameClass}
                    disabled={toolsRunning}
                    fullWidth
                  >
                    Update Name Class
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {toolsLog.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Console Output
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: '#1e1e1e', p: 2, borderRadius: 1 }}>
                      <List dense>
                        {toolsLog.map((log, idx) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemText
                              primary={log.message}
                              primaryTypographyProps={{
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                color: log.type === 'error' ? '#ff6b6b' :
                                       log.type === 'success' ? '#51cf66' :
                                       log.type === 'warning' ? '#ffd43b' :
                                       log.type === 'step' ? '#4dabf7' : '#c1c2c5'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
