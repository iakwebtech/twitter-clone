<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PostMedia extends Model
{
    protected $fillable = [
        'post_id',
        'type',
        'file_path',
        'thumbnail_path',
        'mime_type',
        'file_size',
        'width',
        'height',
        'alt_text',
        'sort_order',
    ];

    protected $appends = ['url'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->file_path, 'http')) {
            return $this->file_path;
        }

        return Storage::disk('public')->url($this->file_path);
    }
}
