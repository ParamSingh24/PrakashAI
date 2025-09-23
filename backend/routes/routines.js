
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const routinesDataPath = path.join(__dirname, '../data/routines.json');

// Helper functions to read/write routines
const readRoutines = () => {
  try {
    const routinesJson = fs.readFileSync(routinesDataPath, 'utf-8');
    return JSON.parse(routinesJson);
  } catch (error) {
    console.error('Error reading routines.json:', error);
    return [];
  }
};

const writeRoutines = (data) => {
  try {
    fs.writeFileSync(routinesDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to routines.json:', error);
  }
};

// GET all routines
router.get('/', (req, res) => {
  const routines = readRoutines();
  res.json(routines);
});

// POST a new routine
router.post('/', (req, res) => {
  const routines = readRoutines();
  const newRoutine = {
    id: `routine_${Date.now()}`,
    ...req.body
  };
  routines.push(newRoutine);
  writeRoutines(routines);
  res.status(201).json(newRoutine);
});

// GET a single routine by id
router.get('/:id', (req, res) => {
  const routines = readRoutines();
  const routine = routines.find(r => r.id === req.params.id);
  if (routine) {
    res.json(routine);
  } else {
    res.status(404).send('Routine not found');
  }
});

// PUT (update) a routine
router.put('/:id', (req, res) => {
  const routines = readRoutines();
  const index = routines.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    routines[index] = { ...routines[index], ...req.body };
    writeRoutines(routines);
    res.json(routines[index]);
  } else {
    res.status(404).send('Routine not found');
  }
});

// DELETE a routine
router.delete('/:id', (req, res) => {
  const routines = readRoutines();
  const index = routines.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    const deletedRoutine = routines.splice(index, 1);
    writeRoutines(routines);
    res.json(deletedRoutine);
  } else {
    res.status(404).send('Routine not found');
  }
});

// POST execute a routine
router.post('/:id/execute', (req, res) => {
  const routines = readRoutines();
  const routine = routines.find(r => r.id === req.params.id);
  if (!routine) {
    return res.status(404).send('Routine not found');
  }

  try {
    // Update last executed timestamp
    const index = routines.findIndex(r => r.id === req.params.id);
    routines[index].lastExecuted = new Date().toISOString();
    writeRoutines(routines);
    
    // In a real implementation, you would execute the routine actions here
    console.log(`Executing routine: ${routine.name}`);
    routine.actions.forEach(action => {
      console.log(`  Action: ${action.command} on appliance ${action.applianceId}`);
    });
    
    res.json({ 
      success: true, 
      message: `Routine "${routine.name}" executed successfully`,
      executedAt: routines[index].lastExecuted
    });
  } catch (error) {
    console.error('Error executing routine:', error);
    res.status(500).json({ success: false, error: 'Failed to execute routine' });
  }
});

module.exports = router;
