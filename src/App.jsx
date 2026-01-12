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
} from '@mui/icons-material';
import { parseItemNameFile, parseItemGroupFile, serializeItemNameFile, serializeItemGroupFile, extractIconPath } from './utils/fileParser';

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
        setIconPreview(`/dat/Icon/${iconPath}.png`);
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
        return `/dat/Icon/${iconPath}.png`;
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
            disabled={currentTab === 1}
          >
            Save Changes
          </Button>
        </Box>
        
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Items" />
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
                        <Typography variant="body2" fontWeight="bold">
                          {stripBrackets(item.name)} <Chip 
                            label={getCrystalType(item.id)} 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              height: 20, 
                              fontSize: '0.7rem',
                              display: getCrystalType(item.id) ? 'inline-flex' : 'none'
                            }} 
                          />
                        </Typography>
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
