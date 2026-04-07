const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || '/data/data.json';

// Create directory if it doesn't exist
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initialize database with default structure if file doesn't exist
if (!fs.existsSync(DB_PATH)) {
  const initialData = {
    users: [],
    workouts: [],
    exercises: [
      // Chest exercises
      { id: '1', name: 'Push-ups', muscleGroups: ['chest', 'triceps'], equipment: 'bodyweight', duration: 60 },
      { id: '2', name: 'Bench Press', muscleGroups: ['chest'], equipment: 'barbell', duration: 180 },
      { id: '3', name: 'Dumbbell Flyes', muscleGroups: ['chest'], equipment: 'dumbbells', duration: 120 },
      { id: '4', name: 'Incline Push-ups', muscleGroups: ['chest', 'shoulders'], equipment: 'bodyweight', duration: 60 },
      
      // Back exercises
      { id: '5', name: 'Pull-ups', muscleGroups: ['back', 'biceps'], equipment: 'pull-up bar', duration: 90 },
      { id: '6', name: 'Deadlifts', muscleGroups: ['back', 'legs'], equipment: 'barbell', duration: 180 },
      { id: '7', name: 'Bent-over Rows', muscleGroups: ['back'], equipment: 'dumbbells', duration: 120 },
      { id: '8', name: 'Superman', muscleGroups: ['back'], equipment: 'bodyweight', duration: 45 },
      
      // Legs exercises
      { id: '9', name: 'Squats', muscleGroups: ['legs'], equipment: 'bodyweight', duration: 90 },
      { id: '10', name: 'Lunges', muscleGroups: ['legs'], equipment: 'bodyweight', duration: 120 },
      { id: '11', name: 'Leg Press', muscleGroups: ['legs'], equipment: 'machine', duration: 150 },
      { id: '12', name: 'Calf Raises', muscleGroups: ['legs'], equipment: 'bodyweight', duration: 60 },
      
      // Shoulders exercises
      { id: '13', name: 'Pike Push-ups', muscleGroups: ['shoulders'], equipment: 'bodyweight', duration: 75 },
      { id: '14', name: 'Shoulder Press', muscleGroups: ['shoulders'], equipment: 'dumbbells', duration: 120 },
      { id: '15', name: 'Lateral Raises', muscleGroups: ['shoulders'], equipment: 'dumbbells', duration: 90 },
      { id: '16', name: 'Front Raises', muscleGroups: ['shoulders'], equipment: 'dumbbells', duration: 90 },
      
      // Arms exercises
      { id: '17', name: 'Bicep Curls', muscleGroups: ['biceps'], equipment: 'dumbbells', duration: 90 },
      { id: '18', name: 'Tricep Dips', muscleGroups: ['triceps'], equipment: 'bodyweight', duration: 75 },
      { id: '19', name: 'Hammer Curls', muscleGroups: ['biceps'], equipment: 'dumbbells', duration: 90 },
      { id: '20', name: 'Diamond Push-ups', muscleGroups: ['triceps'], equipment: 'bodyweight', duration: 60 },
      
      // Core exercises
      { id: '21', name: 'Plank', muscleGroups: ['core'], equipment: 'bodyweight', duration: 60 },
      { id: '22', name: 'Russian Twists', muscleGroups: ['core'], equipment: 'bodyweight', duration: 90 },
      { id: '23', name: 'Mountain Climbers', muscleGroups: ['core'], equipment: 'bodyweight', duration: 60 },
      { id: '24', name: 'Bicycle Crunches', muscleGroups: ['core'], equipment: 'bodyweight', duration: 90 }
    ]
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], workouts: [], exercises: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getAll(collection) {
  const db = readDB();
  return db[collection] || [];
}

function getById(collection, id) {
  const items = getAll(collection);
  return items.find(item => item.id === id);
}

function insert(collection, item) {
  const db = readDB();
  if (!db[collection]) db[collection] = [];
  db[collection].push(item);
  writeDB(db);
  return item;
}

function update(collection, id, data) {
  const db = readDB();
  if (!db[collection]) return null;
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return null;
  db[collection][index] = { ...db[collection][index], ...data };
  writeDB(db);
  return db[collection][index];
}

function remove(collection, id) {
  const db = readDB();
  if (!db[collection]) return false;
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return false;
  const removed = db[collection].splice(index, 1)[0];
  writeDB(db);
  return removed;
}

module.exports = { getAll, getById, insert, update, remove };