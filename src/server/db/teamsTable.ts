import { Database } from 'sql.js';

export interface TeamMember {
  userId: string;
  telegramId?: number;
  handle: string;
  name: string;
  joinedAt: string;
  status: 'active' | 'invited' | 'declined';
  role?: string;
}

export interface TeamRecord {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  members: TeamMember[];
  channels: string[];
  createdAt: string;
}

export function initTeamsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT,
      invite_code TEXT UNIQUE,
      members TEXT,
      channels TEXT,
      created_at TEXT
    );
  `);
}

/**
 * Synchronize channels for a team by fetching all channels registered in the 'channels' table
 * for the owner and all team members. Updates the 'channels' column in 'teams' table.
 */
export function syncTeamChannelsFromDb(db: Database, teamId: string): string[] {
  try {
    const team = getTeamById(db, teamId);
    if (!team) return [];

    // Collect all participant user IDs
    const userIds = new Set<string>();
    if (team.ownerId) userIds.add(String(team.ownerId).trim());
    if (Array.isArray(team.members)) {
      team.members.forEach(m => {
        if (m.userId) userIds.add(String(m.userId).trim());
        if (m.telegramId) userIds.add(String(m.telegramId).trim());
      });
    }

    if (userIds.size === 0) return team.channels || [];

    const idList = Array.from(userIds).map(id => `'${id}'`).join(',');
    const sql = `SELECT DISTINCT username, name FROM channels WHERE user_id IN (${idList}) OR user_id = '16926299042' OR user_id = '169262990'`;
    const res = db.exec(sql);

    const actualChannels: string[] = [];
    if (res && res.length > 0 && res[0].values) {
      res[0].values.forEach(row => {
        const u = String(row[0] || row[1] || '').trim();
        if (u && !actualChannels.includes(u)) {
          actualChannels.push(u);
        }
      });
    }

    const filteredChannels = actualChannels.filter(c => c !== '@shishkarnem' && c !== '@BorgheseClub' && c !== '@Rentrop_HR_bot');

    // Update in database
    db.run(
      `UPDATE teams SET channels = ? WHERE id = ?`,
      [JSON.stringify(filteredChannels), team.id]
    );

    return filteredChannels;
  } catch (e) {
    console.error('[TeamsTable] Error syncing team channels:', e);
    return [];
  }
}

/**
 * Look up a user in the SQLite 'users' table by username/handle, telegram_id, id, or email.
 */
export function findUserInDb(db: Database, handleOrId: string): any | null {
  try {
    const clean = String(handleOrId || '').trim().replace(/^@/, '');
    if (!clean) return null;

    const res = db.exec(
      `SELECT * FROM users WHERE username = '${clean}' OR username = '@${clean}' OR id = '${clean}' OR telegram_id = '${clean}' OR email = '${clean}' LIMIT 1`
    );

    if (!res || res.length === 0 || !res[0].values.length) return null;

    const cols = res[0].columns;
    const row = res[0].values[0];
    const userObj: any = {};
    cols.forEach((col, idx) => {
      userObj[col] = row[idx];
    });

    return userObj;
  } catch (e) {
    console.error('[TeamsTable] Error finding user in DB:', e);
    return null;
  }
}

export function seedDefaultTeams(db: Database) {
  try {
    const ownerId = '16926299042';
    const check = db.exec(`SELECT * FROM teams WHERE owner_id = '${ownerId}' OR owner_id = '169262990'`);
    if (!check || check.length === 0 || !check[0].values.length) {
      // Create initial team for main admin if no team exists
      const initialTeamId = `team_${ownerId}`;
      const defaultMembers: TeamMember[] = [
        {
          userId: '80926979801',
          telegramId: 8092697980,
          handle: '@DigiStaff',
          name: 'Александр DigiStaff',
          joinedAt: '2026-08-04T23:46:55.000Z',
          status: 'active',
          role: 'Участник'
        },
        {
          userId: '16187387221',
          telegramId: 1618738722,
          handle: '@renatzakir',
          name: 'Renat Zakir',
          joinedAt: '2026-08-04T23:46:55.000Z',
          status: 'active',
          role: 'Участник'
        }
      ];

      db.run(
        `INSERT INTO teams (id, owner_id, name, invite_code, members, channels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          initialTeamId,
          ownerId,
          'SMM Команда SAV_AI',
          initialTeamId,
          JSON.stringify(defaultMembers),
          JSON.stringify([]),
          new Date().toISOString()
        ]
      );

      // Sync channels from database
      syncTeamChannelsFromDb(db, initialTeamId);
    }
  } catch (e) {
    console.error('[TeamsTable] Error seeding default teams:', e);
  }
}

export function getTeamsByOwnerOrMember(db: Database, userId: string): TeamRecord[] {
  try {
    const cleanId = String(userId).trim();
    const shortId = cleanId.replace(/\d$/, '');
    const res = db.exec(`SELECT * FROM teams WHERE owner_id = '${cleanId}' OR owner_id = '${shortId}' OR members LIKE '%${cleanId}%' OR members LIKE '%${shortId}%'`);
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });

      // Synchronize channels from channels table for all team members
      const teamId = obj.id;
      const syncedChannels = syncTeamChannelsFromDb(db, teamId);

      return {
        id: obj.id,
        ownerId: obj.owner_id,
        name: obj.name || 'Команда',
        inviteCode: obj.invite_code || obj.id || '',
        members: obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [],
        channels: syncedChannels.length > 0 ? syncedChannels : (obj.channels ? JSON.parse(obj.channels) : []),
        createdAt: obj.created_at || new Date().toISOString()
      };
    });
  } catch (e) {
    console.error('Error fetching teams:', e);
    return [];
  }
}

export function addMemberToTeamInDb(db: Database, teamIdOrOwnerId: string, member: TeamMember): TeamRecord | null {
  try {
    let team = getTeamById(db, teamIdOrOwnerId);
    if (!team) {
      const teams = getTeamsByOwnerOrMember(db, teamIdOrOwnerId);
      team = teams[0] || null;
    }
    if (!team) return null;

    const existingMembers = team.members.filter(m => m.userId !== member.userId && m.handle.toLowerCase() !== member.handle.toLowerCase());
    existingMembers.push(member);
    team.members = existingMembers;

    db.run(
      `UPDATE teams SET members = ? WHERE id = ?`,
      [JSON.stringify(existingMembers), team.id]
    );

    // Sync channels with newly added member's channels
    const syncedChannels = syncTeamChannelsFromDb(db, team.id);
    team.channels = syncedChannels;

    return team;
  } catch (e) {
    console.error('Error adding member to team:', e);
    return null;
  }
}

export function removeMemberFromTeamInDb(db: Database, teamIdOrOwnerId: string, memberUserIdOrHandle: string): TeamRecord | null {
  try {
    let team = getTeamById(db, teamIdOrOwnerId);
    if (!team) {
      const teams = getTeamsByOwnerOrMember(db, teamIdOrOwnerId);
      team = teams[0] || null;
    }
    if (!team) return null;

    const cleanTarget = memberUserIdOrHandle.replace(/^@/, '').toLowerCase();
    const newMembers = team.members.filter(m => {
      const mId = String(m.userId || '').toLowerCase();
      const mHandle = String(m.handle || '').replace(/^@/, '').toLowerCase();
      return mId !== cleanTarget && mHandle !== cleanTarget;
    });
    team.members = newMembers;

    db.run(
      `UPDATE teams SET members = ? WHERE id = ?`,
      [JSON.stringify(newMembers), team.id]
    );

    // Sync channels after removal
    const syncedChannels = syncTeamChannelsFromDb(db, team.id);
    team.channels = syncedChannels;

    return team;
  } catch (e) {
    console.error('Error removing member from team:', e);
    return null;
  }
}

export function getAllTeamsFromDb(db: Database): TeamRecord[] {
  try {
    const res = db.exec("SELECT * FROM teams ORDER BY created_at DESC");
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;

    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });

      const syncedChannels = syncTeamChannelsFromDb(db, obj.id);

      return {
        id: obj.id,
        ownerId: obj.owner_id,
        name: obj.name || 'Команда',
        inviteCode: obj.invite_code || obj.id || '',
        members: obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [],
        channels: syncedChannels.length > 0 ? syncedChannels : (obj.channels ? JSON.parse(obj.channels) : []),
        createdAt: obj.created_at || new Date().toISOString()
      };
    });
  } catch (e) {
    console.error('Error fetching all teams from db:', e);
    return [];
  }
}

export function getTeamById(db: Database, id: string): TeamRecord | null {
  try {
    const cleanId = String(id).trim();
    const res = db.exec(`SELECT * FROM teams WHERE id = '${cleanId}' OR id = 'team_${cleanId}' OR invite_code = '${cleanId}' LIMIT 1`);
    if (!res || res.length === 0 || !res[0].values.length) return null;
    const columns = res[0].columns;
    const row = res[0].values[0];
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });

    const syncedChannels = syncTeamChannelsFromDb(db, obj.id);

    return {
      id: obj.id,
      ownerId: obj.owner_id,
      name: obj.name || 'Команда',
      inviteCode: obj.invite_code || obj.id || '',
      members: obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [],
      channels: syncedChannels.length > 0 ? syncedChannels : (obj.channels ? JSON.parse(obj.channels) : []),
      createdAt: obj.created_at || new Date().toISOString()
    };
  } catch (e) {
    console.error('Error getting team by id:', e);
    return null;
  }
}

export function createTeamInDb(db: Database, data: Partial<TeamRecord>): TeamRecord {
  const ownerId = String(data.ownerId || '16926299042').trim();
  const id = data.id || `team_${ownerId}_${Date.now()}`;
  const name = data.name || 'SMM Команда';
  const inviteCode = data.inviteCode || id;
  const members = Array.isArray(data.members) ? data.members : [];
  const channels = Array.isArray(data.channels) ? data.channels : [];
  const createdAt = data.createdAt || new Date().toISOString();

  db.run(
    `INSERT INTO teams (id, owner_id, name, invite_code, members, channels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, ownerId, name, inviteCode, JSON.stringify(members), JSON.stringify(channels), createdAt]
  );

  // Sync channels from database
  const syncedChannels = syncTeamChannelsFromDb(db, id);

  return {
    id,
    ownerId,
    name,
    inviteCode,
    members,
    channels: syncedChannels.length > 0 ? syncedChannels : channels,
    createdAt
  };
}

export function updateTeamInDb(db: Database, id: string, updates: Partial<TeamRecord>): TeamRecord | null {
  try {
    const existing = getTeamById(db, id);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const members = updates.members !== undefined ? updates.members : existing.members;
    const channels = updates.channels !== undefined ? updates.channels : existing.channels;
    const ownerId = updates.ownerId !== undefined ? updates.ownerId : existing.ownerId;
    const inviteCode = updates.inviteCode !== undefined ? updates.inviteCode : existing.inviteCode;

    db.run(
      `UPDATE teams SET name = ?, members = ?, channels = ?, owner_id = ?, invite_code = ? WHERE id = ?`,
      [name, JSON.stringify(members), JSON.stringify(channels), ownerId, inviteCode, existing.id]
    );

    const syncedChannels = syncTeamChannelsFromDb(db, existing.id);

    return {
      ...existing,
      name,
      members,
      channels: syncedChannels.length > 0 ? syncedChannels : channels,
      ownerId,
      inviteCode
    };
  } catch (e) {
    console.error('Error updating team in db:', e);
    return null;
  }
}

export function deleteTeamInDb(db: Database, id: string): boolean {
  try {
    const cleanId = String(id).trim();
    db.run(`DELETE FROM teams WHERE id = ? OR id = ? OR invite_code = ?`, [cleanId, `team_${cleanId}`, cleanId]);
    return true;
  } catch (e) {
    console.error('Error deleting team from db:', e);
    return false;
  }
}
