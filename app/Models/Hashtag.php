<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Hashtag extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'posts_count',
        'is_restricted',
        'is_trending',
    ];

    protected function casts(): array
    {
        return [
            'posts_count' => 'integer',
            'is_restricted' => 'boolean',
            'is_trending' => 'boolean',
        ];
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_hashtags')->withTimestamps();
    }
}
