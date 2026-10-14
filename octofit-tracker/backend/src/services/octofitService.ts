import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function invalidInput(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function toObjectId(value: unknown, fieldName: string) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || !mongoose.isValidObjectId(text)) {
    throw invalidInput(`${fieldName} must be a valid MongoDB ObjectId`);
  }
  return text;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const userId = toObjectId(body.userId, 'userId');
  const teamId = toObjectId(body.teamId, 'teamId');
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!type || !Number.isFinite(minutes) || minutes <= 0) {
    throw invalidInput('Activity type and minutes are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw invalidInput('User not found', 404);
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw invalidInput('Team not found', 404);
  }

  try {
    const created = await Activity.create({
      user: userId,
      team: teamId,
      type,
      minutes,
      points: minutes,
      occurredAt: new Date(),
    });
    return created.toObject();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw Object.assign(new Error(error.message), { status: 400 });
    }
    throw error;
  }
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';

  if (!name) {
    throw invalidInput('Team name is required');
  }
  if (!mascot) {
    throw invalidInput('Team mascot is required');
  }

  const members = Array.isArray(body.members) ? body.members : [];
  const normalizedMembers = members.map((member) => {
    const id = typeof member === 'string' ? member.trim() : '';
    if (!id || !mongoose.isValidObjectId(id)) {
      throw invalidInput('Team members must be valid user IDs');
    }
    return new mongoose.Types.ObjectId(id);
  });

  try {
    const created = await Team.create({ name, mascot, members: normalizedMembers });
    return created.toObject();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw Object.assign(new Error(error.message), { status: 400 });
    }
    throw error;
  }
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return rows.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail?.trim();
  if (!email) {
    throw invalidInput('User email is required');
  }

  const user = await User.findOne({ email: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } }).lean();
  if (!user) {
    throw invalidInput('User not found', 404);
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const recentType = typeof recentActivity?.type === 'string' ? recentActivity.type.trim().toLowerCase() : '';
  const focusMatches = [...new Set([goal, recentType].filter(Boolean))];

  let workouts = await Workout.find({ focus: { $in: focusMatches } }).sort({ minutes: -1 }).lean();
  if (workouts.length === 0) {
    workouts = await Workout.find().limit(3).lean();
  }

  return workouts.slice(0, 3).map((workout) => ({
    ...workout,
    reason: recentType
      ? `Matches your ${goal || recentType} goal and recent ${recentType} activity.`
      : `Matches your ${goal || 'fitness'} goal.`,
  }));
}

export { User };
