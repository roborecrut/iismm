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
  db.run(`
    CREATE TABLE IF NOT EXISTS team_reports (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      period TEXT,
      posts_published INTEGER DEFAULT 0,
      posts_scheduled INTEGER DEFAULT 0,
      channels_count INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);
}

/**
 * Helper to fetch a raw team row without triggering any sync/recursion.
 */
function getRawTeamRecord(db: Database, teamId: string): { id: string; ownerId: string; members: TeamMember[]; channels: string[] } | null {
  try {
    const cleanId = String(teamId || '').trim();
    if (!cleanId) return null;
    const res = db.exec(`SELECT id, owner_id, members, channels FROM teams WHERE id = '${cleanId}' OR id = 'team_${cleanId}' OR invite_code = '${cleanId}' LIMIT 1`);
    if (!res || res.length === 0 || !res[0].values.length) return null;
    const row = res[0].values[0];
    const idVal = String(row[0] || '');
    const ownerIdVal = String(row[1] || '');
    let membersVal: TeamMember[] = [];
    try {
      if (row[2]) membersVal = typeof row[2] === 'string' ? JSON.parse(row[2] as string) : (row[2] as any);
    } catch (e) {}
    let channelsVal: string[] = [];
    try {
      if (row[3]) channelsVal = typeof row[3] === 'string' ? JSON.parse(row[3] as string) : (row[3] as any);
    } catch (e) {}
    return {
      id: idVal,
      ownerId: ownerIdVal,
      members: membersVal,
      channels: channelsVal
    };
  } catch (e) {
    return null;
  }
}

/**
 * Synchronize channels for a team by fetching all channels registered in the 'channels' table
 * for the owner and all team members. Updates the 'channels' column in 'teams' table.
 */
export function syncTeamChannelsFromDb(
  db: Database,
  teamId: string,
  preloadedTeam?: { id?: string; ownerId?: string; members?: TeamMember[]; channels?: string[] }
): string[] {
  try {
    const team = preloadedTeam || getRawTeamRecord(db, teamId);
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

    const targetId = team.id || teamId;
    if (targetId) {
      // Update in database
      db.run(
        `UPDATE teams SET channels = ? WHERE id = ?`,
        [JSON.stringify(filteredChannels), targetId]
      );
    }

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
    const raw = String(handleOrId || '').trim();
    if (!raw) return null;

    const clean = raw.replace(/^@/, '').replace(/^user_/, '').trim();
    const cleanLower = clean.toLowerCase();

    // Query with multiple flexible criteria and case-insensitivity
    const res = db.exec(
      `SELECT * FROM users 
       WHERE LOWER(username) = '${cleanLower}' 
          OR LOWER(username) = '@${cleanLower}' 
          OR username = 'user_${clean}'
          OR id = '${clean}' 
          OR id = '${raw}'
          OR id = 'user_${clean}'
          OR telegram_id = '${clean}' 
          OR telegram_id = '${raw}'
          OR LOWER(email) = '${cleanLower}'
          OR (first_name IS NOT NULL AND LOWER(first_name) LIKE '%${cleanLower}%')
          OR (last_name IS NOT NULL AND LOWER(last_name) LIKE '%${cleanLower}%')
       LIMIT 1`
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
    const check = db.exec(`SELECT * FROM teams WHERE owner_id = '${ownerId}' OR owner_id = '169262990' OR id = 'team_${ownerId}'`);
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
        `INSERT OR REPLACE INTO teams (id, owner_id, name, invite_code, members, channels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
    const rawId = String(userId || '').trim();
    const cleanId = rawId.replace(/^team_/, '').trim();
    const shortId = cleanId.replace(/\d$/, '');
    const res = db.exec(`SELECT * FROM teams WHERE owner_id = '${cleanId}' OR owner_id = '${shortId}' OR owner_id = '${rawId}' OR id = '${rawId}' OR id = 'team_${cleanId}' OR members LIKE '%${cleanId}%' OR members LIKE '%${shortId}%'`);
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });

      const members = obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [];
      const channels = obj.channels ? (typeof obj.channels === 'string' ? JSON.parse(obj.channels) : obj.channels) : [];
      const syncedChannels = syncTeamChannelsFromDb(db, obj.id, {
        id: obj.id,
        ownerId: obj.owner_id,
        members,
        channels
      });

      return {
        id: obj.id,
        ownerId: obj.owner_id,
        name: obj.name || 'Команда',
        inviteCode: obj.invite_code || obj.id || '',
        members,
        channels: syncedChannels.length > 0 ? syncedChannels : channels,
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

    // If team still doesn't exist, automatically create default team for this owner!
    if (!team) {
      const cleanOwnerId = String(teamIdOrOwnerId || '16926299042').replace(/^team_/, '').trim();
      const teamId = `team_${cleanOwnerId}`;
      team = createTeamInDb(db, {
        id: teamId,
        ownerId: cleanOwnerId,
        name: 'SMM Команда SAV_AI',
        inviteCode: teamId,
        channels: [],
        members: [member]
      });
      return team;
    }

    const existingMembers = (team.members || []).filter(m => {
      const sameId = m.userId && member.userId && String(m.userId) === String(member.userId);
      const sameHandle = m.handle && member.handle && m.handle.toLowerCase() === member.handle.toLowerCase();
      return !sameId && !sameHandle;
    });
    existingMembers.push(member);
    team.members = existingMembers;

    db.run(
      `UPDATE teams SET members = ? WHERE id = ?`,
      [JSON.stringify(existingMembers), team.id]
    );

    // Sync channels with newly added member's channels
    const syncedChannels = syncTeamChannelsFromDb(db, team.id, {
      id: team.id,
      ownerId: team.ownerId,
      members: existingMembers,
      channels: team.channels
    });
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
    const syncedChannels = syncTeamChannelsFromDb(db, team.id, {
      id: team.id,
      ownerId: team.ownerId,
      members: newMembers,
      channels: team.channels
    });
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

      const members = obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [];
      const channels = obj.channels ? (typeof obj.channels === 'string' ? JSON.parse(obj.channels) : obj.channels) : [];
      const syncedChannels = syncTeamChannelsFromDb(db, obj.id, {
        id: obj.id,
        ownerId: obj.owner_id,
        members,
        channels
      });

      return {
        id: obj.id,
        ownerId: obj.owner_id,
        name: obj.name || 'Команда',
        inviteCode: obj.invite_code || obj.id || '',
        members,
        channels: syncedChannels.length > 0 ? syncedChannels : channels,
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

    const members = obj.members ? (typeof obj.members === 'string' ? JSON.parse(obj.members) : obj.members) : [];
    const channels = obj.channels ? (typeof obj.channels === 'string' ? JSON.parse(obj.channels) : obj.channels) : [];
    const syncedChannels = syncTeamChannelsFromDb(db, obj.id, {
      id: obj.id,
      ownerId: obj.owner_id,
      members,
      channels
    });

    return {
      id: obj.id,
      ownerId: obj.owner_id,
      name: obj.name || 'Команда',
      inviteCode: obj.invite_code || obj.id || '',
      members,
      channels: syncedChannels.length > 0 ? syncedChannels : channels,
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
