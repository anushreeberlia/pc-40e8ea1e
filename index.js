const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { getAll, getById, insert, update, remove } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Gym Trainer API is running' });
});

// User routes
app.post('/api/users', (req, res) => {
  const { name, equipment, fitnessLevel } = req.body;
  const user = {
    id: uuidv4(),
    name,
    equipment: equipment || [],
    fitnessLevel: fitnessLevel || 'beginner',
    workoutHistory: [],
    createdAt: new Date().toISOString()
  };
  insert('users', user);
  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = getById('users', req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const updatedUser = update('users', req.params.id, req.body);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(updatedUser);
});

// Exercise routes
app.get('/api/exercises', (req, res) => {
  const exercises = getAll('exercises');
  res.json(exercises);
});

// Generate workout plan
app.post('/api/workouts/generate', (req, res) => {
  const { userId, timeLimit, muscleGroups, equipment } = req.body;
  
  const user = getById('users', userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const allExercises = getAll('exercises');
  
  // Filter exercises based on muscle groups and equipment
  let filteredExercises = allExercises.filter(exercise => {
    const hasMatchingMuscleGroup = exercise.muscleGroups.some(mg => 
      muscleGroups.includes(mg)
    );
    const hasCompatibleEquipment = equipment.includes(exercise.equipment) || 
                                   exercise.equipment === 'bodyweight';
    return hasMatchingMuscleGroup && hasCompatibleEquipment;
  });
  
  // Avoid recently done exercises
  const recentWorkouts = user.workoutHistory.slice(-3);
  const recentExerciseIds = recentWorkouts.flatMap(w => w.exercises.map(e => e.id));
  
  // Prioritize exercises not done recently
  const freshExercises = filteredExercises.filter(e => !recentExerciseIds.includes(e.id));
  const availableExercises = freshExercises.length > 0 ? freshExercises : filteredExercises;
  
  // Select exercises within time limit
  const selectedExercises = [];
  let totalTime = 0;
  const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
  
  for (const exercise of shuffled) {
    if (totalTime + exercise.duration <= timeLimit * 60) {
      selectedExercises.push({
        ...exercise,
        sets: user.fitnessLevel === 'beginner' ? 2 : user.fitnessLevel === 'intermediate' ? 3 : 4,
        reps: getRecommendedReps(exercise, user.fitnessLevel)
      });
      totalTime += exercise.duration;
    }
    if (selectedExercises.length >= 6) break; // Max 6 exercises per workout
  }
  
  const workout = {
    id: uuidv4(),
    userId,
    exercises: selectedExercises,
    muscleGroups,
    totalTime: Math.ceil(totalTime / 60),
    createdAt: new Date().toISOString(),
    completed: false
  };
  
  insert('workouts', workout);
  res.json(workout);
});

// Get workout alternatives for exercise swapping
app.get('/api/exercises/alternatives', (req, res) => {
  const { muscleGroup, equipment, excludeIds } = req.query;
  const allExercises = getAll('exercises');
  
  const alternatives = allExercises.filter(exercise => {
    const hasMatchingMuscleGroup = exercise.muscleGroups.includes(muscleGroup);
    const hasCompatibleEquipment = equipment.split(',').includes(exercise.equipment) || 
                                   exercise.equipment === 'bodyweight';
    const notExcluded = !excludeIds.split(',').includes(exercise.id);
    return hasMatchingMuscleGroup && hasCompatibleEquipment && notExcluded;
  });
  
  res.json(alternatives);
});

// Complete workout
app.post('/api/workouts/:id/complete', (req, res) => {
  const workout = getById('workouts', req.params.id);
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  
  // Mark workout as completed
  const completedWorkout = update('workouts', req.params.id, { completed: true });
  
  // Add to user's workout history
  const user = getById('users', workout.userId);
  if (user) {
    const updatedHistory = [...user.workoutHistory, {
      id: workout.id,
      exercises: workout.exercises,
      completedAt: new Date().toISOString(),
      muscleGroups: workout.muscleGroups
    }];
    update('users', workout.userId, { workoutHistory: updatedHistory.slice(-10) }); // Keep last 10 workouts
  }
  
  res.json(completedWorkout);
});

// Get user's workout history
app.get('/api/users/:id/history', (req, res) => {
  const user = getById('users', req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user.workoutHistory || []);
});

function getRecommendedReps(exercise, fitnessLevel) {
  const baseReps = {
    beginner: 8,
    intermediate: 12,
    advanced: 15
  };
  
  // Adjust based on exercise type
  if (exercise.muscleGroups.includes('core')) {
    return baseReps[fitnessLevel] + 5;
  }
  if (exercise.equipment === 'bodyweight') {
    return baseReps[fitnessLevel] + 2;
  }
  return baseReps[fitnessLevel];
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});