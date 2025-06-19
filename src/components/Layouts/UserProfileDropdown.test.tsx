/**
 * @file UserProfileDropdown.test.tsx
 * @description Test for UserProfileDropdown component. Ensures default avatar (default_avatar0.jpg) is shown if no user avatar is set, and user avatar is shown if set.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { UserProfileDropdown } from './UserProfileDropdown';

// Mock DatabaseService
vi.mock('../../services/database', () => {
  return {
    DatabaseService: {
      getInstance: () => ({
        initialize: vi.fn(),
        getUserProfile: vi.fn(),
        updateUserProfile: vi.fn(),
      })
    }
  };
});

// Mock default avatar import
vi.mock('@/assets/default_avatar0.jpg', () => ({ default: '/test-default-avatar0.jpg' }));

// Helper to update mock return value
async function setMockUserProfile(profile: any) {
  const { DatabaseService } = await import('../../services/database');
  const dbInstance = DatabaseService.getInstance();
  (dbInstance.getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
}

describe('UserProfileDropdown', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('shows default avatar if no user avatar is set', async () => {
    await setMockUserProfile(null);
    render(<UserProfileDropdown />);
    // Wait for avatar to appear
    const avatarImg = await screen.findByRole('img');
    // Check if the src attribute contains the default avatar path
    expect(avatarImg.getAttribute('src')).toContain('test-default-avatar0.jpg');
  });

  it('shows user avatar if set', async () => {
    const userAvatarUrl = '/custom-avatar.png';
    await setMockUserProfile({
      nickname: 'TestUser',
      is_registered: true,
      avatar_url: userAvatarUrl,
    });
    render(<UserProfileDropdown />);
    const avatarImg = await screen.findByRole('img');
    expect(avatarImg).toHaveAttribute('src', userAvatarUrl);
  });
}); 