<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'is_verified',
        'is_private',
        'is_suspended',
        'is_deactivated',
        'deactivated_at',
        'last_seen_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'is_private' => 'boolean',
            'is_suspended' => 'boolean',
            'is_deactivated' => 'boolean',
            'deactivated_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_likes')->withTimestamps();
    }

    public function reposts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_reposts')->withTimestamps();
    }

    public function bookmarks(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_bookmarks')->withTimestamps();
    }

    public function bookmarkCollections(): HasMany
    {
        return $this->hasMany(BookmarksCollection::class);
    }

    public function drafts(): HasMany
    {
        return $this->hasMany(PostDraft::class);
    }

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')->withTimestamps();
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')->withTimestamps();
    }

    public function sentFollowRequests(): HasMany
    {
        return $this->hasMany(FollowRequest::class, 'sender_id');
    }

    public function receivedFollowRequests(): HasMany
    {
        return $this->hasMany(FollowRequest::class, 'receiver_id');
    }

    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocker_id', 'blocked_id')->withTimestamps();
    }

    public function blockedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocked_id', 'blocker_id')->withTimestamps();
    }

    public function mutedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'mutes', 'muter_id', 'muted_id')->withTimestamps();
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['role', 'last_read_at', 'joined_at'])
            ->withTimestamps();
    }

    public function loginActivities(): HasMany
    {
        return $this->hasMany(LoginActivity::class);
    }

    public function lists(): HasMany
    {
        return $this->hasMany(UserList::class);
    }

    public function recentSearches(): HasMany
    {
        return $this->hasMany(RecentSearch::class);
    }

    public function isFollowing(User $user): bool
    {
        return $this->following()->where('following_id', $user->id)->exists();
    }

    public function hasPendingFollowRequestTo(User $user): bool
    {
        return $this->sentFollowRequests()
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->exists();
    }

    public function isBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_id', $user->id)->exists();
    }

    public function isBlockedBy(User $user): bool
    {
        return $this->blockedByUsers()->where('blocker_id', $user->id)->exists();
    }

    public function isMuted(User $user): bool
    {
        return $this->mutedUsers()->where('muted_id', $user->id)->exists();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isModerator(): bool
    {
        return in_array($this->role, ['admin', 'moderator'], true);
    }

    public function isActive(): bool
    {
        return ! $this->is_suspended && ! $this->is_deactivated;
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at !== null && $this->last_seen_at->gt(now()->subMinutes(5));
    }
}
