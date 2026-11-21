<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'who_can_reply',
        'who_can_mention',
        'who_can_message',
        'email_notifications',
        'push_notifications',
        'theme',
        'two_factor_enabled',
        'two_factor_secret',
    ];

    protected $hidden = [
        'two_factor_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'two_factor_enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
