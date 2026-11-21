<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'bio',
        'location',
        'website',
        'birth_date',
        'avatar',
        'cover_image',
        'pinned_post_id',
        'followers_count',
        'following_count',
        'posts_count',
    ];

    protected $appends = [
        'avatar_url',
        'cover_url',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'followers_count' => 'integer',
            'following_count' => 'integer',
            'posts_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pinnedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'pinned_post_id');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http')) {
            return $this->avatar;
        }

        return Storage::disk('public')->url($this->avatar);
    }

    public function getCoverUrlAttribute(): ?string
    {
        if (! $this->cover_image) {
            return null;
        }

        if (str_starts_with($this->cover_image, 'http')) {
            return $this->cover_image;
        }

        return Storage::disk('public')->url($this->cover_image);
    }
}
