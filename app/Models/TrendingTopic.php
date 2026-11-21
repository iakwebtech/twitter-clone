<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrendingTopic extends Model
{
    protected $fillable = [
        'title',
        'category',
        'posts_count',
        'score',
        'is_active',
        'period',
    ];

    protected function casts(): array
    {
        return [
            'posts_count' => 'integer',
            'score' => 'float',
            'is_active' => 'boolean',
        ];
    }
}
