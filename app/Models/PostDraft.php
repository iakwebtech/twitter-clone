<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostDraft extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'media_paths',
        'poll_data',
        'visibility',
        'location',
    ];

    protected function casts(): array
    {
        return [
            'media_paths' => 'array',
            'poll_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
