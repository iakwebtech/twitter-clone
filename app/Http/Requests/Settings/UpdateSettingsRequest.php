<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'is_private' => ['sometimes', 'boolean'],
            'who_can_reply' => ['sometimes', 'in:everyone,following,mentioned'],
            'who_can_mention' => ['sometimes', 'in:everyone,following,nobody'],
            'who_can_message' => ['sometimes', 'in:everyone,following,nobody'],
            'email_notifications' => ['sometimes', 'boolean'],
            'push_notifications' => ['sometimes', 'boolean'],
            'theme' => ['sometimes', 'in:system,light,dark'],
            'two_factor_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
