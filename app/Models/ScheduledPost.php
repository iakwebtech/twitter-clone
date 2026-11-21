<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledPost extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'media_paths',
        'poll_data',
        'visibility',
        'location',
        'scheduled_for',
        'status',
        'published_post_id',
    ];

    protected function casts(): array
    {
        return [
            'media_paths' => 'array',
            'poll_data' => 'array',
            'scheduled_for' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function publishedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'published_post_id');
    }
}
