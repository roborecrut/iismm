import { Database } from 'sql.js';

export interface TeamMember {
  userId: string;
  telegramId?: number;
  handle: string;
  name: string;
  joinedAt: string;
  status: 'active' | 'invited' | 'declined';
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

export function seedDefaultTeams(db: Database) {
  try {
    const ownerId = '16926299042';
    const defaultMembers: TeamMember[] = [
      {
        userId: '80926979801',
        telegramId: 8092697980,
        handle: '@DigiStaff',
        name: 'Александр DigiStaff',
        joinedAt: '2026-08-04T23:46:55.000Z',
        status: 'active'
      },
      {
        userId: '16187387221',
        telegramId: 1618738722,
        handle: '@renatzakir',
        name: 'Renat Zakir',
        joinedAt: '2026-08-04T23:46:55.000Z',
        status: 'active'
      }
    ];

    let actualChannels: string[] = [];
    try {
      const chRes = db.exec(`SELECT username FROM channels WHERE user_id = '${ownerId}' OR user_id = '169262990'`);
      if (chRes && chRes.length > 0 && chRes[0].values) {
        actualChannels = chRes[0].values.map(v => String(v[0])).filter(u => u && u.startsWith('@'));
      }
    } catch (e) {}

    if (actualChannels.length === 0) {
      actualChannels = ['@SAV_AI', '@rentrop'];
    }

    const check = db.exec(`SELECT * FROM teams WHERE owner_id = '${ownerId}' OR owner_id = '169262990'`);
    if (!check || check.length === 0 || !check[0].values.length) {
      db.run(
        `INSERT INTO teams (id, owner_id, name, invite_code, members, channels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `team_${ownerId}`,
          ownerId,
          'SMM Команда SAV_AI',
          `team_${ownerId}`,
          JSON.stringify(defaultMembers),
          JSON.stringify(actualChannels),
          new Date().toISOString()
        ]
      );
    } else {
      // Ensure existing team in DB has members 80926979801 and 16187387221 and no dummy bots (dmitry_editor, anna_smm)
      const row = check[0].values[0];
      const cols = check[0].columns;
      const teamId = row[cols.indexOf('id')] as string;
      const membersStr = row[cols.indexOf('members')] as string;
      let members: TeamMember[] = membersStr ? JSON.parse(membersStr) : [];

      // Filter out dummy bots
      members = members.filter(m => m.handle !== '@dmitry_editor' && m.handle !== '@anna_smm');

      // Ensure 80926979801 is present
      if (!members.some(m => m.userId === '80926979801' || m.handle === '@DigiStaff')) {
        members.push(defaultMembers[0]);
      }
      // Ensure 16187387221 is present
      if (!members.some(m => m.userId === '16187387221' || m.handle === '@renatzakir')) {
        members.push(defaultMembers[1]);
      }

      db.run(
        `UPDATE teams SET members = ?, channels = ?, owner_id = ? WHERE id = ?`,
        [JSON.stringify(members), JSON.stringify(actualChannels), ownerId, teamId]
      );
    }
  } catch (e) {
    console.error('[TeamsTable] Error seeding default teams:', e);
  }
}

export function getTeamsByOwnerOrMember(db: Database, userId: string): TeamRecord[] {
  try {
    const cleanId = String(userId);
    const shortId = cleanId.replace(/\d$/, ''); // e.g., 16926299042 -> 169262990
    const res = db.exec(`SELECT * FROM teams WHERE owner_id = '${cleanId}' OR owner_id = '${shortId}' OR members LIKE '%${cleanId}%' OR members LIKE '%${shortId}%'`);
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });

      const ownerId = obj.owner_id || '16926299042';
      let realChannels: string[] = [];
      try {
        const chRes = db.exec(`SELECT username FROM channels WHERE user_id = '${ownerId}' OR user_id = '169262990' OR user_id = '16926299042'`);
        if (chRes && chRes.length > 0 && chRes[0].values) {
          realChannels = chRes[0].values.map(v => String(v[0])).filter(u => u && u.startsWith('@'));
        }
      } catch (e) {}

      const storedChannels = obj.channels ? JSON.parse(obj.channels) : [];
      const finalChannels = realChannels.length > 0 ? realChannels : storedChannels.filter((c: string) => c !== '@shishkarnem' && c !== '@BorgheseClub' && c !== '@Rentrop_HR_bot');

      return {
        id: obj.id,
        ownerId: obj.owner_id,
        name: obj.name || 'Команда',
        inviteCode: obj.invite_code || '',
        members: obj.members ? JSON.parse(obj.members) : [],
        channels: finalChannels,
        createdAt: obj.created_at || new Date().toISOString()
      };
    });
  } catch (e) {
    console.error('Error fetching teams:', e);
    return [];
  }
}

export function addMemberToTeamInDb(db: Database, ownerId: string, member: TeamMember): TeamRecord | null {
  try {
    const teams = getTeamsByOwnerOrMember(db, ownerId);
    let team = teams.find(t => t.ownerId === ownerId || t.ownerId.startsWith(ownerId.slice(0, 9)));
    if (!team) {
      seedDefaultTeams(db);
      const recheck = getTeamsByOwnerOrMember(db, ownerId);
      team = recheck[0];
    }
    if (!team) return null;

    const existingMembers = team.members.filter(m => m.userId !== member.userId && m.handle !== member.handle);
    existingMembers.push(member);
    team.members = existingMembers;

    db.run(
      `UPDATE teams SET members = ? WHERE id = ?`,
      [JSON.stringify(existingMembers), team.id]
    );
    return team;
  } catch (e) {
    console.error('Error adding member to team:', e);
    return null;
  }
}

export function removeMemberFromTeamInDb(db: Database, ownerId: string, memberUserIdOrHandle: string): TeamRecord | null {
  try {
    const teams = getTeamsByOwnerOrMember(db, ownerId);
    let team = teams.find(t => t.ownerId === ownerId || t.ownerId.startsWith(ownerId.slice(0, 9)));
    if (!team) return null;

    const newMembers = team.members.filter(m => m.userId !== memberUserIdOrHandle && m.handle !== memberUserIdOrHandle && m.handle !== `@${memberUserIdOrHandle.replace(/^@/, '')}`);
    team.members = newMembers;

    db.run(
      `UPDATE teams SET members = ? WHERE id = ?`,
      [JSON.stringify(newMembers), team.id]
    );
    return team;
  } catch (e) {
    console.error('Error removing member from team:', e);
    return null;
  }
}

