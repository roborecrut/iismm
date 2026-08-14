import React, { useState, useEffect } from 'react';
import IirkySocialNetwork from '../components/IirkySocialNetwork';
import ProfileHeader from '../components/ProfileHeader';
import { UserAccount } from '../types';

interface SocialPageProps {
  user: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  currentPath?: string;
  onLogout?: () => void;
  onAvatarFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SocialPage({ 
  user, 
  onUpdateUser, 
  currentPath = '/social',
  onLogout,
  onAvatarFileUpload
}: SocialPageProps) {
  const [targetUser, setTargetUser] = useState<UserAccount>(user);

  // Extract userId from path if present (e.g. /social/16926299042 vs /social/feed)
  const pathParts = currentPath.split('/').filter(Boolean);
  const secondPart = pathParts[1] || '';
  const isKnownSubTab = ['feed', 'messages', 'deals', 'coauthors', 'saved', 'ratings'].includes(secondPart);
  const targetId = (!isKnownSubTab && secondPart) ? secondPart : null;

  useEffect(() => {
    if (!targetId || targetId === user.id || targetId === String(user.telegramId)) {
      setTargetUser(user);
      return;
    }

    fetch(`/api/users/${targetId}`)
      .then(res => res.json())
      .then(data => {
        if (data && (data.id || data.telegramId)) {
          setTargetUser({
            id: String(data.id || targetId),
            telegramId: data.telegramId || (isNaN(Number(targetId)) ? undefined : Number(targetId)),
            name: data.firstName || data.name || data.first_name || `Пользователь ${targetId}`,
            firstName: data.firstName || data.name || data.first_name,
            username: data.username || data.telegramUsername,
            telegramUsername: data.telegramUsername || (data.username ? `@${data.username}` : undefined),
            avatarUrl: data.avatarUrl || data.photoUrl,
            photoUrl: data.photoUrl || data.avatarUrl,
            role: data.role || 'user',
            tariff: data.tariff || 'Старт',
            iirky: data.balance || data.iirky || 300,
            createdAt: data.createdAt || data.created_at
          });
        }
      })
      .catch(() => {
        setTargetUser({
          id: targetId,
          telegramId: isNaN(Number(targetId)) ? undefined : Number(targetId),
          name: `Пользователь ${targetId}`,
          role: 'user',
          tariff: 'Старт',
          iirky: 300
        });
      });
  }, [targetId, user]);

  const isOwnProfile = !targetId || targetId === user.id || targetId === String(user.telegramId);

  return (
    <div className="space-y-6">
      <ProfileHeader 
        user={targetUser}
        isSocialPage={true}
        isOwnProfile={isOwnProfile}
        onLogout={onLogout}
        onAvatarFileUpload={onAvatarFileUpload}
      />
      <IirkySocialNetwork 
        user={targetUser} 
        currentUser={user} 
        onUpdateUser={onUpdateUser} 
        currentPath={currentPath} 
      />
    </div>
  );
}
